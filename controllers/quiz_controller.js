var models = require("../models");
var Sequelize = require('sequelize');

var paginate = require('../helpers/paginate').paginate;

// Autoload el quiz asociado a :quizId
exports.load = function(req, res, next, quizId) {

    models.Quiz.findById(quizId)
        .then(function(quiz) {
            if (quiz) {
                req.quiz = quiz;
                next();
            } else {
                throw new Error('No existe ningún quiz con id=' + quizId);
            }
        })
        .catch(function(error) {
            next(error);
        });
};


// GET /quizzes
exports.index = function(req, res, next) {

    var countOptions = {};

    // Busquedas:
    var search = req.query.search || '';
    if (search) {
        var search_like = "%" + search.replace(/ +/g, "%") + "%";

        countOptions.where = { question: { $like: search_like } };
    }

    models.Quiz.count(countOptions)
        .then(function(count) {

            // Paginacion:

            var items_per_page = 10;

            // La pagina a mostrar viene en la query
            var pageno = parseInt(req.query.pageno) || 1;

            // Crear un string con el HTML que pinta la botonera de paginacion.
            // Lo añado como una variable local de res para que lo pinte el layout de la aplicacion.
            res.locals.paginate_control = paginate(count, items_per_page, pageno, req.url);

            var findOptions = countOptions;

            findOptions.offset = items_per_page * (pageno - 1);
            findOptions.limit = items_per_page;

            return models.Quiz.findAll(findOptions);
        })
        .then(function(quizzes) {
            res.render('quizzes/index.ejs', {
                quizzes: quizzes,
                search: search
            });
        })
        .catch(function(error) {
            next(error);
        });
};


// GET /quizzes/:quizId
exports.show = function(req, res, next) {

    res.render('quizzes/show', { quiz: req.quiz });
};


// GET /quizzes/new
exports.new = function(req, res, next) {

    var quiz = { question: "", answer: "" };

    res.render('quizzes/new', { quiz: quiz });
};


// POST /quizzes/create
exports.create = function(req, res, next) {

    var quiz = models.Quiz.build({
        question: req.body.question,
        answer: req.body.answer
    });

    // guarda en DB los campos pregunta y respuesta de quiz
    quiz.save({ fields: ["question", "answer"] })
        .then(function(quiz) {
            req.flash('success', 'Quiz creado con éxito.');
            res.redirect('/quizzes/' + quiz.id);
        })
        .catch(Sequelize.ValidationError, function(error) {

            req.flash('error', 'Errores en el formulario:');
            for (var i in error.errors) {
                req.flash('error', error.errors[i].value);
            }

            res.render('quizzes/new', { quiz: quiz });
        })
        .catch(function(error) {
            req.flash('error', 'Error al crear un Quiz: ' + error.message);
            next(error);
        });
};


// GET /quizzes/:quizId/edit
exports.edit = function(req, res, next) {

    res.render('quizzes/edit', { quiz: req.quiz });
};


// PUT /quizzes/:quizId
exports.update = function(req, res, next) {

    req.quiz.question = req.body.question;
    req.quiz.answer = req.body.answer;

    req.quiz.save({ fields: ["question", "answer"] })
        .then(function(quiz) {
            req.flash('success', 'Quiz editado con éxito.');
            res.redirect('/quizzes/' + req.quiz.id);
        })
        .catch(Sequelize.ValidationError, function(error) {

            req.flash('error', 'Errores en el formulario:');
            for (var i in error.errors) {
                req.flash('error', error.errors[i].value);
            }

            res.render('quizzes/edit', { quiz: req.quiz });
        })
        .catch(function(error) {
            req.flash('error', 'Error al editar el Quiz: ' + error.message);
            next(error);
        });
};


// DELETE /quizzes/:quizId
exports.destroy = function(req, res, next) {

    req.quiz.destroy()
        .then(function() {
            req.flash('success', 'Quiz borrado con éxito.');
            res.redirect('/quizzes');
        })
        .catch(function(error) {
            req.flash('error', 'Error al editar el Quiz: ' + error.message);
            next(error);
        });
};


// GET /quizzes/:quizId/play
exports.play = function(req, res, next) {

    var answer = req.query.answer || '';

    res.render('quizzes/play', {
        quiz: req.quiz,
        answer: answer
    });
};


// GET /quizzes/:quizId/check
exports.check = function(req, res, next) {

    var answer = req.query.answer || "";

    var result = answer.toLowerCase().trim() === req.quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz: req.quiz,
        result: result,
        answer: answer
    });
};



function newRamdon(maxP) {                          // random índice válido
    ret = Math.floor(Math.random() * maxP);
    //console.log("generando [" + maxP +"]["+ret+"]");

    return ret;
}


function randomQuiz(entorno) {
    entorno.rndmInex = newRamdon(entorno.allQuiz.length);
    return createCont(entorno.allQuiz[entorno.rndmInex].id,
        entorno.allQuiz[entorno.rndmInex].question,
        entorno.allQuiz[entorno.rndmInex].answer);
}

function createCont(id, question, answer) {                         //estrucutura del objeto
    return { "id": id, "question": question, "answer": answer };

}
// GET /quizzes/randomplay
//var score=0;
// var result=true ;
// var allQuiz=[] ;
// var rndmInex ;

exports.randomplay = function(req, res, next) {

    var quiz;
    var entorno;                                    //variable de sesión
    if (req.session.entorno == null) {              // si no hay sesión iniciada. Inicializamos valores.
        entorno = { 'score': 0, 'result': true, 'allQuiz': [], 'rndmInex': 0 };
    } else {
        entorno = req.session.entorno;  // si no mantenemos los que había
    }

    if (!entorno.result || !entorno.allQuiz.length) { // hemos fallado o hemos acertado todos

        entorno.score = 0;                             // Puntuación a 0
        while (entorno.allQuiz.length) {               // vamos eliminando de la base de datos
            entorno.allQuiz.pop();
        }
        models.Quiz.findAll()                           //Extraemos valores de la base de datos
            .then(function(iuiz) {
                for (var i in iuiz) {
                    entorno.allQuiz.push(createCont(iuiz[i].id, iuiz[i].question, iuiz[i].answer)); // y los introducimos en entorno
                }
                quiz = randomQuiz(entorno);                 // Generar quiz aleatorio (var=)
                req.session.entorno = entorno;  // guardamos en sesion
                randomRender(req, res, next, quiz);             // renderizamos
            })
    } else {
        quiz = randomQuiz(entorno);                         //var
        req.session.entorno = entorno;
        randomRender(req, res, next, quiz);
    }

};

function randomRender(req, res, next, quiz) {
    var entorno;
    if (req.session.entorno == null) {
        entorno = { 'score': 0, 'result': true, 'allQuiz': [], 'rndmInex': 0 };

    } else {
        entorno = req.session.entorno;          // Coger datos de la sesión
    }
    res.render('quizzes/random_play.ejs', {                 // renderizar incrustando code en quiz, score, answer
        quiz: quiz,
        score: entorno.score,
        answer: quiz.answer
    });
}
// GET /quizzes/randomcheck

exports.randomcheck = function(req, res, next) {

    if (req.session.entorno == null) {
        entorno = { 'score': 0, 'result': true, 'allQuiz': [], 'rndmInex': 0 };
    } else {
        entorno = req.session.entorno;          // coger datos de sesion || var globales 
    }
    var answer = req.query.answer || "";                    // pillar la anser de la query(url)
    entorno.result = answer.toLowerCase().trim() === req.quiz.answer.toLowerCase().trim();
    entorno.score += entorno.result ? 1 : -entorno.score;
    if (entorno.result) {
        entorno.allQuiz.splice(entorno.rndmInex, 1);        // eliminamos quiz 
    }
    req.session.entorno = entorno;          // actualizamos datos de sesion
    if (entorno.allQuiz.length) {           //mientras haya quizzes se renderiza random_result
 res.render('quizzes/random_result.ejs', {
             quiz: req.quiz,
             score: entorno.score,
             answer: answer,
             result: entorno.result
         });
    } else {
      res.render('quizzes/random_nomore.ejs', { score: entorno.score }); //no quizzes, ya has ganado
    }
};
