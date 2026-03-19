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
        const respId = request.body.apoUsrId;
        const apoQtdApostas = 0;
        const apoStatus = 'A';

        const [apoId] = await connection('apogrupos').insert({
            apoResId: respId,
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
      
            console.log(lista)
            return response.json(lista);
        } catch (error) {
          console.error("Erro ao listar grupos apostas:", error);
          return response.status(500).json({ error: "Erro ao listar grupos apostas" });
        }
    },

    async getById(request, response) {
      const { id } = request.params;

      const jogo = await connection("jogEsportivos")
        .where("jogId", id)
        .innerJoin('equEsportivas as times1', 'times1.selId', 'jogEsportivos.jogSelIdMan')
        .innerJoin('equEsportivas as times2', 'times2.selId', 'jogEsportivos.jogSelIdVis')
        .select([
          "jogEsportivos.*",
          'times1.selName as timeA_name',
          'times1.selCor1 as timeA_color1',
          'times1.selCor2 as timeA_color2',
          'times2.selName as timeB_name',
          'times2.selCor1 as timeB_color1',
          'times2.selCor2 as timeB_color2',
        ])     
        .first();

      return response.json(jogo);
    },

  async searchGrupo(request, response) {
    try {
      const apoId = request.params.apoId;
      
      console.log('Buscando grupo:', apoId)
      
      if (!apoId) {
        return response.status(400).json({ error: "ID do grupo não informado." });
      }

      const grupo = await connection("apogrupos")
        .innerJoin("jogEsportivos", "jogEsportivos.jogId", "apogrupos.apoJogId") 
        .innerJoin("equEsportivas as timeA", "timeA.selId", "jogEsportivos.jogSelIdMan")
        .innerJoin("equEsportivas as timeB", "timeB.selId", "jogEsportivos.jogSelIdVis")
        .where("apogrupos.apoId", apoId)
        .select([
          "apogrupos.*",
          "jogEsportivos.*",
          "timeA.selName as timeA_name",
          "timeA.selAvatar as timeA_bandeira",
          "timeB.selName as timeB_name",
          "timeB.selAvatar as timeB_bandeira",
        ])
        .first();

      if (!grupo) {
        return response.status(404).json({ error: "Grupo não encontrado." });
      }

      console.log(grupo);
      return response.json(grupo);

    } catch (error) {
      console.error("Erro ao buscar grupo:", error);
      return response.status(500).json({ error: "Erro interno ao buscar grupo." });
    }
  },
 
};
