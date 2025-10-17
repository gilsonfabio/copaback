const { Console } = require('console');
const connection = require('../database/connection');

module.exports = {   
    async index (request, response) {
        const eventos = await connection('eveEsportivos')
        .orderBy('eveId')
        .select('*');
        
        return response.json(eventos);
    },    
        
    async create(request, response) {
        const {eveDescricao} = request.body;
        const [eveId] = await connection('eveEsportivos').insert({
            eveTitulo,
            eveDatInicio,
            eveDatFinal,
            eveLocal,
            eveDescricao 
        });
           
        return response.json({eveId});
    }, 
    
    async lisEventos(request, response) {
        try {
          const lista = await connection("eveEsportivos")
            .orderBy("eveId")
            .select("*");
      
          return response.json(lista);
        } catch (error) {
          console.error("Erro ao listar eventos:", error);
          return response.status(500).json({ error: "Erro ao listar eventos" });
        }
      },
};
