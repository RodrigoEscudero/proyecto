var express = require('express');
var router = express.Router();

var quizController = require('../controllers/quiz_controller');
var tipController = require('../controllers/tip_controller');
var userController = require('../controllers/user_controller');
var sessionController = require('../controllers/session_controller');

//-----------------------------------------------------------

// autologout
router.all('*',sessionController.deleteExpiredUserSession);

//-----------------------------------------------------------


//-----------------------------------------------------------

// History

function redirectBack(req, res, next) {

    var url = req.session.backURL || "/";
    delete req.session.backURL;
    res.redirect(url);
}

router.get('/goback', redirectBack);

// Rutas GET que no acaban en /new, /edit, /play, /check, /session, o /:id.
router.get(/(?!\/new$|\/edit$|\/play$|\/check$|\/session$|\/(\d+)$)\/[^\/]*$/, function (req, res, next) {

    req.session.backURL = req.url;
    next();
});

//-----------------------------------------------------------

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index');
});

// Pagina de creditos
router.get('/author', function (req, res, next) {
    res.render('author');
});
// Pagina de ayuda
router.get('/help', function(req, res, next) {
    res.render('Ayuda');
});


// Autoload de rutas que usen :quizId
router.param('quizId', quizController.load);
router.param('userId', userController.load);
router.param('tipId',  tipController.load);


// Definición de rutas de sesion
router.get('/session', sessionController.new);     // formulario login
router.post('/session', sessionController.create);  // crear sesión
router.delete('/session', sessionController.destroy); // destruir sesión


// Definición de rutas de cuenta
router.get('/users',
    sessionController.loginRequired,
    userController.index);   // listado usuarios
router.get('/users/:userId(\\d+)',
    sessionController.loginRequired,
    userController.show);    // ver un usuario
router.get('/users/new',
    userController.new);     // formulario sign un
router.post('/users',
    userController.create);  // registrar usuario
router.get('/users/:userId(\\d+)/edit',
    sessionController.loginRequired,
    sessionController.adminOrMyselfRequired,
    userController.edit);     // editar información de cuenta
router.put('/users/:userId(\\d+)',
    sessionController.loginRequired,
    sessionController.adminOrMyselfRequired,
    userController.update);   // actualizar información de cuenta
router.delete('/users/:userId(\\d+)',
    sessionController.loginRequired,
    sessionController.adminOrMyselfRequired,
    userController.destroy);  // borrar cuenta

router.get('/users/:userId(\\d+)/quizzes', quizController.index);     // ver las preguntas de un usuario



// Definición de rutas de /quizzes
router.get('/quizzes',
    quizController.index);
router.get('/quizzes/:quizId(\\d+)',
    quizController.show);
router.get('/quizzes/new',
    sessionController.loginRequired,
    quizController.new);
router.post('/quizzes',
    sessionController.loginRequired,
    quizController.create);
router.get('/quizzes/:quizId(\\d+)/edit',
    sessionController.loginRequired,
    quizController.adminOrAuthorRequired,
    quizController.edit);
router.put('/quizzes/:quizId(\\d+)',
    sessionController.loginRequired,
    quizController.adminOrAuthorRequired,
    quizController.update);
router.delete('/quizzes/:quizId(\\d+)',
    sessionController.loginRequired,
    quizController.adminOrAuthorRequired,
    quizController.destroy);

router.get('/quizzes/:quizId(\\d+)/play',
    quizController.play);
router.get('/quizzes/:quizId(\\d+)/check',
    quizController.check);


router.get('/quizzes/:quizId(\\d+)/tips/new',
    sessionController.loginRequired,
    tipController.new);
router.post('/quizzes/:quizId(\\d+)/tips',
    sessionController.loginRequired,
    tipController.create);
router.put('/quizzes/:quizId(\\d+)/tips/:tipId(\\d+)/accept',
    sessionController.loginRequired,
    quizController.adminOrAuthorRequired,
    tipController.accept);
router.delete('/quizzes/:quizId(\\d+)/tips/:tipId(\\d+)',
    sessionController.loginRequired,
    tipController.destroy);


module.exports = router;
