const express = require('express');
const { body, validationResult } = require('express-validator');
const ensureAuth = require('../middleware/ensureAuth');
const Request = require('../models/Request');

const router = express.Router();

router.get('/painel', ensureAuth, async (req, res, next) => {
  try {
    const isAdmin = req.session.user.role === 'admin';
    const query = isAdmin ? {} : { client: req.session.user.id };

    const requests = await Request.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const totals = requests.reduce(
      (acc, request) => {
        acc.total += 1;
        if (request.status === 'Novo') acc.new += 1;
        if (request.status === 'Em análise') acc.inAnalysis += 1;
        if (request.status === 'Em progresso') acc.inProgress += 1;
        if (request.status === 'Concluído') acc.completed += 1;
        return acc;
      },
      { total: 0, new: 0, inAnalysis: 0, inProgress: 0, completed: 0 }
    );

    res.render('dashboard', {
      title: 'Painel do cliente',
      requests,
      totals,
      formData: {},
      errors: [],
      success: false,
      isAdmin,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/solicitacoes',
  ensureAuth,
  [
    body('serviceInterest').trim().notEmpty().withMessage('Informe o tipo de projecto desejado'),
    body('details').trim().isLength({ min: 10 }).withMessage('Descreva a sua ideia com pelo menos 10 caracteres'),
    body('phone').optional({ checkFalsy: true }).trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    const formData = req.body;

    const isAdmin = req.session.user.role === 'admin';

    if (!errors.isEmpty()) {
      try {
        const query = isAdmin ? {} : { client: req.session.user.id };

        const requests = await Request.find(query)
          .sort({ createdAt: -1 })
          .lean();

        const totals = requests.reduce(
          (acc, request) => {
            acc.total += 1;
            if (request.status === 'Novo') acc.new += 1;
            if (request.status === 'Em análise') acc.inAnalysis += 1;
            if (request.status === 'Em progresso') acc.inProgress += 1;
            if (request.status === 'Concluído') acc.completed += 1;
            return acc;
          },
          { total: 0, new: 0, inAnalysis: 0, inProgress: 0, completed: 0 }
        );

        return res.status(400).render('dashboard', {
          title: 'Painel do cliente',
          requests,
          totals,
          formData,
          errors: errors.array(),
          success: false,
          isAdmin,
        });
      } catch (error) {
        return next(error);
      }
    }

    if (isAdmin) {
      try {
        const requests = await Request.find({})
          .sort({ createdAt: -1 })
          .lean();

        const totals = requests.reduce(
          (acc, request) => {
            acc.total += 1;
            if (request.status === 'Novo') acc.new += 1;
            if (request.status === 'Em análise') acc.inAnalysis += 1;
            if (request.status === 'Em progresso') acc.inProgress += 1;
            if (request.status === 'Concluído') acc.completed += 1;
            return acc;
          },
          { total: 0, new: 0, inAnalysis: 0, inProgress: 0, completed: 0 }
        );

        return res.status(403).render('dashboard', {
          title: 'Painel do cliente',
          requests,
          totals,
          formData: {},
          errors: [{ msg: 'Administradores gerenciam pedidos existentes e não podem criar novos.' }],
          success: false,
          isAdmin,
        });
      } catch (error) {
        return next(error);
      }
    }

    try {
      await Request.create({
        client: req.session.user.id,
        contactName: req.session.user.name,
        contactEmail: req.session.user.email,
        phone: req.body.phone,
        serviceInterest: req.body.serviceInterest,
        details: req.body.details,
        isContact: false,
      });

      const requests = await Request.find({ client: req.session.user.id })
        .sort({ createdAt: -1 })
        .lean();

      const totals = requests.reduce(
        (acc, request) => {
          acc.total += 1;
          if (request.status === 'Novo') acc.new += 1;
          if (request.status === 'Em análise') acc.inAnalysis += 1;
          if (request.status === 'Em progresso') acc.inProgress += 1;
          if (request.status === 'Concluído') acc.completed += 1;
          return acc;
        },
        { total: 0, new: 0, inAnalysis: 0, inProgress: 0, completed: 0 }
      );

      res.render('dashboard', {
        title: 'Painel do cliente',
        requests,
        totals,
        formData: {},
        errors: [],
        success: true,
        isAdmin,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
