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
        try {
          const lista = await connection("grpcopa")
            .orderBy("grpId")
            .select("*");
      
          return response.json(lista);
        } catch (error) {
          console.error("Erro ao listar grupos:", error);
          return response.status(500).json({ error: "Erro ao listar grupos" });
        }
      },
};
