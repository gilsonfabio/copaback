const express = require('express');
const routes = express.Router();

const UsersController = require('./controllers/UsersController');
const GruposController = require('./controllers/GruposController');
const SelecoesController = require('./controllers/SelecoesController');
const JogosController = require('./controllers/JogosController');
const PagSeguroController = require('./controllers/PagSeguroController');
const GrpApostasController = require('./controllers/GrpApostasController');
const EventosController = require('./controllers/EventosController');

routes.get('/', (request, response) => {
    response.json({
        message: 'Bem-vindo ao servidor BackCopa!',
    });
});

routes.post('/signIn', UsersController.signIn);
routes.post('/newuser', UsersController.newuser);
routes.get('/searchUser/:cpf', UsersController.searchUser);
routes.get('/busUser/:idUsr', UsersController.busUser);
routes.post('/loginCpf', UsersController.loginCPF);

routes.get('/grupos', GruposController.index);
routes.post('/newgrupo', GruposController.create);
routes.get('/lisGrupos', GruposController.lisGrupos);

routes.get('/grpApostas/:jogId', GrpApostasController.lisGrpApostas);
routes.post('/newgrpAposta', GruposController.create);

routes.get('/selecoes', SelecoesController.index);
routes.post('/newselecao', SelecoesController.create);
routes.get('/lisSelecoes', SelecoesController.lisSelecoes);

routes.get('/lisJogos/:grpId', JogosController.lisJogos);
routes.post('/criarPalpite', JogosController.criarPalpite);
routes.get('/searchJogo/:jogId', JogosController.searchJogo);

routes.get('/eventos', EventosController.index);
routes.post('/newevento', EventosController.create);
routes.get('/lisEventos', EventosController.lisEventos);

routes.post('/webhook/pagseguro', PagSeguroController.webhook);

module.exports = routes;
