const { Console } = require('console');
const connection = require('../database/connection');

module.exports = {   
    async webhook(request, response) {
        try {
          // ✅ Recebe dados do PagSeguro
          const payload = request.body;
          console.log("📩 Webhook recebido:", JSON.stringify(payload, null, 2));
    
          // Identifica o ID de referência
          const referenceId = payload.reference_id || payload.id;
          console.log("🔗 Reference ID recebido:", referenceId);
    
          if (!referenceId) {
            return response.status(400).json({ error: "reference_id ausente" });
          }
    
          // 🔍 Extrai o palId da referência — ex: "palpite_123"
          const match = referenceId.match(/^palpite_(\d+)/);
          const palId = match ? Number(match[1]) : null;
    
          if (!palId) {
            console.warn("⚠️ reference_id não corresponde ao padrão esperado:", referenceId);
            return response.status(400).json({ error: "Formato inválido de reference_id" });
          }
    
          // 🔄 Extrai status da cobrança
          const charge = payload.charges?.[0];
          const status = charge?.status?.toUpperCase();
    
          console.log(`💰 Status da cobrança (palId ${palId}):`, status);
    
          // ✅ Se o pagamento foi confirmado, atualiza o palpite
          if (status === "PAID" || status === "COMPLETED" || status === "PAID_PENDING_REVIEW") {
            await connection("palpites")
              .where({ palId })
              .update({
                palStatus: 2, // pago
                palPagoEm: new Date(),
              });
    
            console.log("✅ Palpite confirmado e atualizado no banco:", palId);
          } else {
            console.log("ℹ️ Pagamento ainda não confirmado:", status);
          }
    
          // Retorna sucesso ao PagSeguro
          return response.status(200).json({ received: true });
        } catch (err) {
          console.error("❌ Erro no webhook:", err);
          return response.status(500).json({ error: "Erro interno no webhook" });
        }
      },         
};
