var models = require('../models');
var Sequelize = require('sequelize');


// Autoload la pista asociado a :tipId
exports.load = function(req, res, next, tipId) {

    models.Tip.findById(tipId)
        .then(function(tip) {
            if (tip) {
                req.tip = tip;
                next();
            } else {
                next(new Error('No existe tipId=' + tipId));
            }
        })
        .catch(function(error) {
            next(error);
        });
};


// GET /quizzes/:quizId/tips/new
exports.new = function(req, res, next) {

    var tip = {
        text: ""
    };

    res.render('tips/new', {
        tip: tip,
        quiz: req.quiz
    });
};


// POST /quizzes/:quizId/tips
exports.create = function(req, res, next) {

    var authorId = req.session.user && req.session.user.id || 0;

    var tip = models.Tip.build({
        text: req.body.text,
        QuizId: req.quiz.id,
        AuthorId: authorId

    });

    tip.save()
        .then(function(tip) {
            req.flash('success', 'Pista creado con éxito.');

            res.redirect("back");
            // res.redirect('/quizzes/' + req.quiz.id);
        })
        .catch(Sequelize.ValidationError, function(error) {

            req.flash('error', 'Errores en el formulario:');
            for (var i in error.errors) {
                req.flash('error', "" + error.errors[i].value);
            }

            // Necesario usar ""+ en la sentencia anterior porque se pierde la referencia al error.
            res.redirect("back");
        })
        .catch(function(error) {
            req.flash('error', 'Error al crear una Pista: ' + error.message);
            next(error);
        });
};


// GET /quizzes/:quizId/tips/:tipId/accept
exports.accept = function(req, res, next) {

    req.tip.accepted = true;

    req.tip.save(["accepted"])
        .then(function(tip) {
            req.flash('success', 'Pista aceptada con éxito.');
            res.redirect('/quizzes/' + req.params.quizId);
        })
        .catch(function(error) {
            req.flash('error', 'Error al aceptar una Pista: ' + error.message);
            next(error);
        });
};


// DELETE /quizzes/:quizId/tips/:tipId
exports.destroy = function(req, res, next) {

    req.tip.destroy()
        .then(function() {
            req.flash('success', 'Pista eliminada con éxito.');
            res.redirect('/quizzes/' + req.params.quizId);
        })
        .catch(function(error) {
            next(error);
        });
};
