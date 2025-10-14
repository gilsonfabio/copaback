const { Console } = require('console');
const connection = require('../database/connection');

module.exports = {   
    async index (request, response) {
        const selecoes = await connection('selecoes')
        .join('grpcopa', 'grpId', 'selecoes.selGrpId')
        .orderBy('selGrpId', 'selTipo', 'selDescricao')
        .select('*');
        
        return response.json(selecoes);
    },    
        
    async create(request, response) {
        const {
            selName, 
            selTipo, 
            selAvatar, 
            selPntClass, 
            selCrtYellow, 
            selCrtRed, 
            selGolPros, 
            selGolCont, 
            selEsqJogo, 
            selGrpId, 
            selAbreviacao, 
            selStatus} = request.body;

        const [selId] = await connection('selecoes').insert({
            selName, 
            selTipo, 
            selAvatar, 
            selPntClass, 
            selCrtYellow, 
            selCrtRed, 
            selGolPros, 
            selGolCont, 
            selEsqJogo, 
            selGrpId, 
            selAbreviacao, 
            selStatus
        });
           
        return response.json({selId});
    }, 

    async lisSelecoes(request, response) {
        try {
          // Se quiser permitir filtrar por grupo opcionalmente
          const grupoId = request.params.grpId;
      
          let query = connection("selecoes")
            .join("grpcopa", "grpcopa.grpId", "=", "selecoes.selGrpId")
            .orderBy([
              { column: "selGrpId" },
              { column: "selTipo" },
              { column: "selName" }, // ou "selDescricao", conforme seu campo real
            ])
            .select("selecoes.*", "grpcopa.grpDescricao");
      
          if (grupoId) {
            query = query.where("selGrpId", grupoId);
          }
      
          const selecoes = await query;
          return response.json(selecoes);
        } catch (error) {
          console.error("Erro ao listar seleções:", error);
          return response.status(500).json({ error: "Erro ao listar seleções" });
        }
    }, 
};
