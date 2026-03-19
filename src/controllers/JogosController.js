const { Console } = require('console');
const connection = require('../database/connection');
const axios = require("axios");

function gerarExpirationDate() {
  const date = new Date(Date.now() + 3600 * 1000);

  const pad = (n) => String(n).padStart(2, "0");

  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds()) +
    "-03:00"
  );
}


module.exports = {   
    async index (request, response) {
        const jogos = await connection('jogEsportivos')
        .orderBy('jogId')
        .select('*');
        
        return response.json(jogos);
    },
    
    async statusPalpite(request, response) {
  try {
    const { palId } = request.params;

    // 🔥 TRAVA DE SEGURANÇA: Evita que o Knex tente consultar um ID inexistente
    if (!palId || palId === "undefined" || palId === "null") {
      return response.status(400).json({ error: "ID do palpite inválido ou não fornecido" });
    }

    const palpite = await connection("palpites")
      .where({ palId }) // Certifique-se que o nome da coluna no banco é palId
      .first();

    if (!palpite) {
      return response.status(404).json({ error: "Palpite não encontrado" });
    }

    return response.json({
      status: palpite.palStatus, // 1 = aguardando / 2 = pago
    });

  } catch (err) {
    console.error("❌ Erro ao consultar status:", err);
    return response.status(500).json({ error: "Erro interno ao consultar status" });
  }
},
        
    async create(request, response) {
        const {jogData} = request.body;
        const [jogId] = await connection('jogEsportivos').insert({
            jogData,
            jogHoras,
            jogStatus
        });
           
        return response.json({jogId});
    }, 
    
    async lisJogos(request, response) {        
      try {
        const inicio = request.params.datInicial;

        const lista = await connection("jogEsportivos")
          .innerJoin('equEsportivas as times1', 'times1.selId', 'jogEsportivos.jogSelIdMan')
          .innerJoin('equEsportivas as times2', 'times2.selId', 'jogEsportivos.jogSelIdVis')
          .where('jogData', ">=", inicio)    
          .orderBy("jogId")
          .select([
            "jogEsportivos.*",
            'times1.selName as timeA_name',
            'times1.selCor1 as timeA_color1',
            'times1.selCor2 as timeA_color2',
            'times2.selName as timeB_name',
            'times2.selCor1 as timeB_color1',
            'times2.selCor2 as timeB_color2',
          ]);

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
    
        const jogo = await connection("jogEsportivos")
          .innerJoin("equEsportivas as timeA", "timeA.selId", "jogEsportivos.jogSelIdMan")
          .innerJoin("equEsportivas as timeB", "timeB.selId", "jogEsportivos.jogSelIdVis")
          .where("jogEsportivos.jogId", jogId)
          .select([
            "jogEsportivos.*",
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
        // 1️⃣ Salvar palpite no banco
        const [palId] = await connection("palpites").insert({
          palJogId: jogId,
          palApoId: apoId,
          palUsrId: usrId,
          palSelIdMan: jogSelIdMan,
          palSelIdVis: jogSelIdVis,
          palSelGolMan: golMan,
          palSelGolVis: golVis,
          palValor: valor,
          palStatus: 1, // Pendente de pagamento
        });

        const PAGSEGURO_TOKEN = process.env.PAGSEGURO_TOKEN;

        // 2️⃣ Buscar usuário
        const user = await connection("usuarios")
          .where("usrId", usrId)
          .select("usrNome", "usrEmail", "usrCpf")
          .first();

        if (!user) {
          return response.status(400).json({ error: "Usuário não encontrado" });
        }

        // 3️⃣ Configurar expiração (1 hora)
        const expirationDate = new Date(Date.now() + 3600 * 1000)
          .toISOString()
          .split('.')[0] + 'Z';

        // 4️⃣ Montar Body para API de ORDERS (Mais estável que Charges)
        const body = {
          reference_id: `palpite_${palId}`,
          customer: {
            name: user.usrNome,
            email: user.usrEmail,
            tax_id: String(user.usrCpf).replace(/\D/g, "")
          },
          items: [
            {
              name: `Palpite ID ${palId}`,
              quantity: 1,
              unit_amount: Math.round(Number(valor) * 100) // Valor em centavos
            }
          ],
          qr_codes: [
            {
              amount: {
              value: Math.round(Number(valor) * 100)
            },
            expiration_date: expirationDate
          }
        ]
      };

      const headers = {
        Authorization: `Bearer ${PAGSEGURO_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      };

      console.log("\n📤 Enviando ORDER PagSeguro:", JSON.stringify(body, null, 2));

      const orderRes = await axios.post(
        "https://sandbox.api.pagseguro.com/orders",
        body,
        { headers }
      );

      console.log("📥 ORDER criada com sucesso!");

      const orderData = orderRes.data;
      const pixInfo = orderData.qr_codes?.[0];

      if (!pixInfo) {
        return response.status(500).json({ error: "Erro ao gerar PIX no PagSeguro" });
      }

      // 5️⃣ Retornar dados para o Front-end
      // O 'text' é o Copia e Cola, o link com rel 'QRCODE.PNG' é a imagem
      const qrImage = pixInfo.links.find(link => link.rel === "QRCODE.PNG")?.href;

      return response.status(201).json({
        message: "Palpite criado! Aguardando pagamento.",
        palId,
        pix: {
          copia_cola: pixInfo.text,
          imagem_url: qrImage, 
          order_id: orderData.id // Útil para consultar status depois
        }
      });
    } catch (error) {
      console.error("❌ Erro PagSeguro:", error.response?.data || error);
      return response.status(500).json({
        error: "Erro ao processar pagamento",
        detalhe: error.response?.data || error.message
      });
    }
  },
    
  async lisPalpites(request, response) {        
    try {
      const grp = request.params.apoId;
      const lista = await connection("palpites")
        .join('usuarios', 'usrId', 'palpites.palUsrId')
        .join('apogrupos', 'apoId', 'palpites.palApoId')
        .innerJoin('equEsportivas as times1', 'times1.selId', 'palpites.palSelIdMan')
        .innerJoin('equEsportivas as times2', 'times2.selId', 'palpites.palSelIdVis')
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
