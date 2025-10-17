const { Console } = require('console');
const connection = require('../database/connection');

module.exports = {   
    async index (request, response) {
        const jogos = await connection('jogcopa')
        .orderBy('jogId')
        .select('*');
        
        return response.json(jogos);
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
            .select(["jogcopa.*", 'times1.selName As timeA_name', 'times2.selName As timeB_name']);
      
          return response.json(lista);
        } catch (error) {
          console.error("Erro ao listar jogos:", error);
          return response.status(500).json({ error: "Erro ao listar jogos" });
        }
    },

    async searchJogo(request, response) {        
      try {
        const jogo = request.params.jogId;
        const lista = await connection("jogcopa")
          .innerJoin('selecoes as times1', 'times1.selId', 'jogcopa.jogSelIdMan')
          .innerJoin('selecoes as times2', 'times2.selId', 'jogcopa.jogSelIdVis')
          .where('jogId', jogo)    
          .select(["jogcopa.*", 'times1.selName As timeA_name', 'times2.selName As timeB_name']);
    
        return response.json(lista);
      } catch (error) {
        console.error("Erro ao listar jogos:", error);
        return response.status(500).json({ error: "Erro ao listar jogos" });
      }
    },

    async criarPalpite(request, response) {
      const { jogId, apoId, usrId, jogSelIdMan, jogSelIdVis, golMan, golVis, valor } = request.body;
  
      try {
        // 1️⃣ Cria o palpite no banco e pega o ID gerado (palId)
        const [palId] = await connection("palpites").insert(
          {
            palJogId: jogId,
            palApoId: apoId,
            palUsrId: usrId,
            palSelIdMan: jogSelIdMan,
            palSelIdVis: jogSelIdVis,
            palSelGolMan: golMan,
            palSelGolVis: golVis,
            palValor: valor,
            palStatus: 1,
          }    
        );
  
        /*
        // 2️⃣ Cria a cobrança PIX no PagSeguro
        const PAGSEGURO_TOKEN = process.env.PAGSEGURO_TOKEN;
        const WEBHOOK_URL = process.env.PAGSEGURO_WEBHOOK_URL; // 🔗 URL do seu webhook
  
        const headers = {
          Authorization: `Bearer ${PAGSEGURO_TOKEN}`,
          "Content-Type": "application/json",
        };
  
        const body = {
          reference_id: `palpite_${palId}`, // 🔹 agora usa o ID real do palpite
          description: `Palpite jogo ${jogId}`,
          amount: {
            value: Math.round(valor * 100), // em centavos
            currency: "BRL",
          },
          payment_method: {
            type: "PIX",
          },
          notification_urls: [WEBHOOK_URL], // 🔔 URL do webhook
        };
  
        const pagseguroRes = await axios.post(
          "https://sandbox.api.pagseguro.com/orders",
          body,
          { headers }
        );
  
        const qrData = pagseguroRes.data.qr_codes?.[0];
  
        return response.status(201).json({
          message: "Palpite criado e pagamento gerado",
          palId,
          pix: {
            payload: qrData.text, // código PIX copiável
            image: qrData.links?.[0]?.href, // imagem QRCode do PagSeguro
          },
        });
        */
      } catch (error) {
        console.error("❌ Erro ao criar palpite:", error.response?.data || error.message);
        return response.status(500).json({ error: "Erro ao salvar palpite" });
      }
    },
};
