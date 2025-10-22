const { Console } = require('console');
const connection = require('../database/connection');

module.exports = {   
    async index (request, response) {
        const grupos = await connection('grpcopa')
        .orderBy('grpId')
        .select('*');
        
        return response.json(grupos);
    },    
        
    async create(request, response) {
        const {grpDescricao} = request.body;
        const [grpId] = await connection('grpcopa').insert({
            grpDescricao, 
            grpStatus
        });
           
        return response.json({grpId});
    }, 
    
    async lisGrupos(request, response) {
      const evento = request.params.eveId;
      try {
        const grupos = await connection("grpcopa")
          .where("grpEveId", evento)
          .orderBy("grpId")
          .select("*");
  
        const selecoes = await connection("selecoes as s")
          .join("grpcopa as g", "g.grpId", "s.selGrpId")
          .where("g.grpEveId", evento)
          .select(
            "s.*",
            "g.grpDescricao"
          )
          .orderBy("g.grpId")
          .orderBy("s.selId");
  
        const resultado = grupos.map((grupo) => ({
          grpId: grupo.grpId,
          grpDescricao: grupo.grpDescricao,
          selecoes: selecoes.filter((sel) => sel.selGrpId === grupo.grpId),
        }));
  
        return response.json({
          evento: evento,
          grupos: resultado,
        });
      } catch (error) {
        console.error("Erro ao listar grupos:", error);
        return response.status(500).json({ error: "Erro ao listar grupos" });
      }
    },
};
