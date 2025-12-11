const { Console } = require('console');
const connection = require('../database/connection');
const axios = require("axios");

module.exports = {   
    async index (request, response) {
        const jogos = await connection('jogcopa')
        .orderBy('jogId')
        .select('*');
        
        return response.json(jogos);
    },
    
    async statusPalpite (request, response) {
      try {
        const { palId } = request.params;
    
        const palpite = await connection("palpites")
          .where({ palId })
          .first();
    
        if (!palpite) {
          return response.status(404).json({ error: "Palpite não encontrado" });
        }
    
        return response.json({
          status: palpite.palStatus, // 1 = aguardando / 2 = pago
        });
    
      } catch (err) {
        console.error(err);
        return response.status(500).json({ error: "Erro ao consultar status" });
      }
    },
        
    async create(request, response) {
        const {jogData} = request.body;
        const [jogId] = await connection('jogcopa').insert({
            jogData,
            jogHoras,
            jogStatus
        });
           
        return response.json({jogId});
    }, 
    
    async lisJogos(request, response) {        
        try {
          const grp = request.params.grpId;
          const lista = await connection("jogcopa")
            .innerJoin('selecoes as times1', 'times1.selId', 'jogcopa.jogSelIdMan')
            .innerJoin('selecoes as times2', 'times2.selId', 'jogcopa.jogSelIdVis')
            .where('jogGrpId', grp)    
            .orderBy("jogId")
            .select(["jogcopa.*", 'times1.selName As timeA_name', 'times1.selAvatar As selAvatarA', 'times2.selName As timeB_name', 'times2.selAvatar As selAvatarB']);
      
          return response.json(lista);
        } catch (error) {
          console.error("Erro ao listar jogos:", error);
          return response.status(500).json({ error: "Erro ao listar jogos" });
        }
    },

    async searchJogo(request, response) {
      try {
        const { jogId } = request.params;
    
        if (!jogId) {
          return response.status(400).json({ error: "ID do jogo não informado." });
        }
    
        const jogo = await connection("jogcopa")
          .innerJoin("selecoes as timeA", "timeA.selId", "jogcopa.jogSelIdMan")
          .innerJoin("selecoes as timeB", "timeB.selId", "jogcopa.jogSelIdVis")
          .where("jogcopa.jogId", jogId)
          .select([
            "jogcopa.*",
            "timeA.selName as timeA_name",
            "timeA.selAvatar as timeA_bandeira",
            "timeB.selName as timeB_name",
            "timeB.selAvatar as timeB_bandeira",
          ])
          .first();
    
        if (!jogo) {
          return response.status(404).json({ error: "Jogo não encontrado." });
        }
    
        return response.json(jogo);
      } catch (error) {
        console.error("Erro ao buscar jogo:", error);
        return response.status(500).json({ error: "Erro interno ao buscar jogo." });
      }
    },

    async criarPalpite(request, response) {
      const { jogId, apoId, usrId, jogSelIdMan, jogSelIdVis, golMan, golVis, valor } = request.body;
    
      try {
        // 1️⃣ Salvar palpite
        const [palId] = await connection("palpites").insert({
          palJogId: jogId,
          palApoId: apoId,
          palUsrId: usrId,
          palSelIdMan: jogSelIdMan,
          palSelIdVis: jogSelIdVis,
          palSelGolMan: golMan,
          palSelGolVis: golVis,
          palValor: valor,
          palStatus: 1,
        });
    
        const PAGSEGURO_TOKEN = process.env.PAGSEGURO_TOKEN;
        const WEBHOOK_URL = process.env.PAGSEGURO_WEBHOOK_URL;
    
        // 2️⃣ Buscar usuário
        const user = await connection("usuarios")
          .where("usrId", usrId)
          .select("usrNome", "usrEmail", "usrCpf")
          .first();
    
        if (!user) {
          return response.status(400).json({ error: "Usuário não encontrado" });
        }

        const expirationDate = new Date(Date.now() + 3600 * 1000).toISOString();
    
        const headers = {
          Authorization: `Bearer ${PAGSEGURO_TOKEN}`,
          "Content-Type": "application/json"
        };
    
        // 3️⃣ Criar cobrança PIX (API V4)
              
        const body = {
          reference_id: `palpite_${palId}`,
          amount: {
            value: Number(valor),
            currency: "BRL"
          },
          payment_method: {
            type: "PIX",
            pix: {
              "expires_in": 3600
            }
          },
          customer: {
            name: user.usrNome,
            email: user.usrEmail,
            tax_id: String(user.usrCpf).replace(/\D/g, "")
          }
        };

        console.log("\n📤 Enviando CHARGE V4:", JSON.stringify(body, null, 2));
    
        const chargeRes = await axios.post(
          "https://sandbox.api.pagseguro.com/charges",
          body,
          { headers }
        );
    
        console.log("📥 CHARGE criada:", JSON.stringify(chargeRes.data, null, 2));
    
        const charge = chargeRes.data;
    
        // 4️⃣ Obter QR Code PIX
        const pixInfo = charge.payment_method?.pix;
        if (!pixInfo) {
          return response.status(500).json({ error: "PIX não retornou dados válidos" });
        }
    
        const qrCode = pixInfo.qr_code;
        const qrImage = pixInfo.qr_code_base64; // imagem base64
    
        return response.status(201).json({
          message: "Palpite criado com sucesso!",
          palId,
          pix: {
            copia_cola: qrCode,
            imagem_base64: qrImage
          }
        });
    
      } catch (error) {
        console.error("❌ Erro PagSeguro:", error.response?.data || error);
        return response.status(500).json({ error: "Erro ao criar palpite" });
      }
    },
    
    async lisPalpites(request, response) {        
      try {
        const grp = request.params.apoId;
        const lista = await connection("palpites")
          .join('usuarios', 'usrId', 'palpites.palUsrId')
          .join('apogrupos', 'apoId', 'palpites.palApoId')
          .innerJoin('selecoes as times1', 'times1.selId', 'palpites.palSelIdMan')
          .innerJoin('selecoes as times2', 'times2.selId', 'palpites.palSelIdVis')
          .where('palApoId', grp)    
          .orderBy("palId")
          .select(["palpites.*", 'times1.selName As timeA_name', 'times2.selName As timeB_name', 'usuarios.usrNome', 'apogrupos.apoTitulo']);
    
        return response.json(lista);
      } catch (error) {
        console.error("Erro ao listar jogos:", error);
        return response.status(500).json({ error: "Erro ao listar jogos" });
      }
    },
};
