const express = require('express');
const { body, validationResult } = require('express-validator');
const ensureAuth = require('../middleware/ensureAuth');
const Request = require('../models/Request');

const router = express.Router();

const STATUS_OPTIONS = ['Novo', 'Em análise', 'Em progresso', 'Concluído'];

function computeTotals(requests) {
  return requests.reduce(
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
}

async function loadDashboardData({ isAdmin, userId }) {
  const query = isAdmin ? {} : { client: userId };

  let requestQuery = Request.find(query).sort({ createdAt: -1 });

  if (isAdmin) {
    requestQuery = requestQuery.populate('client', 'name email');
  }

  const requests = await requestQuery.lean();
  const normalizedRequests = requests.map((request) => ({
    ...request,
    id: request._id.toString(),
  }));

  const totals = computeTotals(normalizedRequests);

  return { requests: normalizedRequests, totals };
}

router.get('/painel', ensureAuth, async (req, res, next) => {
  try {
    const isAdmin = req.session.user.role === 'admin';
    const { requests, totals } = await loadDashboardData({
      isAdmin,
      userId: req.session.user.id,
    });

    const adminStatusFlash = req.session.adminStatusFlash || null;
    if (req.session.adminStatusFlash) {
      delete req.session.adminStatusFlash;
    }

    res.render('dashboard', {
      title: 'Painel do cliente',
      requests,
      totals,
      formData: {},
      errors: [],
      success: false,
      isAdmin,
      statusOptions: STATUS_OPTIONS,
      adminStatusFlash,
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
        const { requests, totals } = await loadDashboardData({
          isAdmin,
          userId: req.session.user.id,
        });

        return res.status(400).render('dashboard', {
          title: 'Painel do cliente',
          requests,
          totals,
          formData,
          errors: errors.array(),
          success: false,
          isAdmin,
          statusOptions: STATUS_OPTIONS,
          adminStatusFlash: null,
        });
      } catch (error) {
        return next(error);
      }
    }

    if (isAdmin) {
      try {
        const { requests, totals } = await loadDashboardData({
          isAdmin,
          userId: req.session.user.id,
        });

        return res.status(403).render('dashboard', {
          title: 'Painel do cliente',
          requests,
          totals,
          formData: {},
          errors: [{ msg: 'Administradores gerenciam pedidos existentes e não podem criar novos.' }],
          success: false,
          isAdmin,
          statusOptions: STATUS_OPTIONS,
          adminStatusFlash: null,
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

      const { requests, totals } = await loadDashboardData({
        isAdmin,
        userId: req.session.user.id,
      });

      res.render('dashboard', {
        title: 'Painel do cliente',
        requests,
        totals,
        formData: {},
        errors: [],
        success: true,
        isAdmin,
        statusOptions: STATUS_OPTIONS,
        adminStatusFlash: null,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/solicitacoes/:id/status',
  ensureAuth,
  [body('status').isIn(STATUS_OPTIONS).withMessage('Selecione um estado válido para a solicitação.')],
  async (req, res, next) => {
    const isAdmin = req.session.user.role === 'admin';

    if (!isAdmin) {
      req.session.adminStatusFlash = {
        type: 'error',
        message: 'Apenas administradores podem actualizar o estado das solicitações.',
      };
      return res.redirect('/painel');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.session.adminStatusFlash = {
        type: 'error',
        message: errors.array()[0].msg,
      };
      return res.redirect('/painel');
    }

    try {
      const request = await Request.findById(req.params.id);

      if (!request) {
        req.session.adminStatusFlash = {
          type: 'error',
          message: 'Solicitação não encontrada.',
        };
        return res.redirect('/painel');
      }

      request.status = req.body.status;
      await request.save();

      req.session.adminStatusFlash = {
        type: 'success',
        message: `Estado actualizado para "${req.body.status}" com sucesso.`,
      };

      return res.redirect('/painel');
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
