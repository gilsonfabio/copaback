const axios = require("axios");
const connection = require("../database/connection");

module.exports = {
  async webhook(request, response) {
    try {
      const payload = request.body;
      console.log("📩 Webhook recebido (V4):", JSON.stringify(payload, null, 2));

      const chargeId = payload?.data?.id;

      if (!chargeId) {
        return response.status(400).json({ error: "charge_id ausente" });
      }

      // Buscar o charge na API V4
      const chargeDetail = await axios.get(
        `https://api.pagseguro.com/payments/v4/charges/${chargeId}`,
        {
          headers: {
            Authorization: process.env.PAGSEGURO_TOKEN,
            "Content-Type": "application/json"
          }
        }
      );

      const charge = chargeDetail.data;

      console.log("🔎 Detalhes do charge:", charge);

      const referenceId = charge.reference_id;
      const status = charge.status?.toUpperCase();

      if (!referenceId) {
        return response.status(400).json({ error: "reference_id não encontrado" });
      }

      // extrair id
      const palId = Number(referenceId.replace("palpite_", ""));

      const palpite = await connection("palpites")
        .where({ palId })
        .first();

      if (!palpite) {
        return response.status(404).json({ error: "Palpite não encontrado" });
      }

      // se já pago
      if (palpite.palStatus === 2) {
        return response.status(200).json({ duplicated: true });
      }

      // pago
      if (status === "PAID") {
        await connection("palpites")
          .where({ palId })
          .update({
            palStatus: 2,
            palPagoEm: new Date()
          });

        console.log("✅ Pagamento confirmado!");
      }

      return response.status(200).json({ ok: true });

    } catch (err) {
      console.error("❌ Erro no webhook V4:", err);
      return response.status(500).json({ error: "Erro interno" });
    }
  }
};
