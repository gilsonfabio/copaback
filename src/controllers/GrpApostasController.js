const { Console } = require('console');
const connection = require('../database/connection');

module.exports = {   
    async index (request, response) {
        const grpApostas = await connection('apogrupos')
        .orderBy('apoId')
        .select('*');
        
        return response.json(grpApostas);
    },    
        
    async create(request, response) {
        const {apoJogId, apoTitulo, apoVlrAposta} = request.body;
        const apoQtdApostas = 0;
        const apoStatus = 'A';

        const [apoId] = await connection('apogrupos').insert({
            apoJogId,
            apoTitulo,
            apoVlrAposta,
            apoQtdApostas, 
            apoStatus
        });
           
        return response.json({apoId});
    }, 
    
    async lisGrpApostas(request, response) {
        const id = request.params.jogId;
        try {            
          const lista = await connection("apogrupos")
            .where("apoJogId", id)
            .orderBy("apoId")
            .select("*");
      
          return response.json(lista);
        } catch (error) {
          console.error("Erro ao listar grupos apostas:", error);
          return response.status(500).json({ error: "Erro ao listar grupos apostas" });
        }
      },
};
