const express = require('express');
const { body, validationResult } = require('express-validator');
const Request = require('../models/Request');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('home', {
    title: 'Fluxo Softwares — Tecnologia vibrante para acelerar o seu negócio',
  });
});

router.get('/contacto', (req, res) => {
  res.render('contact', {
    title: 'Fale com a Fluxo Softwares',
    formData: {},
    errors: [],
    success: false,
  });
});

router.post(
  '/contacto',
  [
    body('contactName').trim().notEmpty().withMessage('Informe o seu nome'),
    body('contactEmail').trim().isEmail().withMessage('E-mail inválido'),
    body('serviceInterest').trim().notEmpty().withMessage('Selecione um tema de interesse'),
    body('details').trim().isLength({ min: 10 }).withMessage('Descreva a sua necessidade com pelo menos 10 caracteres'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    const formData = req.body;

    if (!errors.isEmpty()) {
      return res.status(400).render('contact', {
        title: 'Fale com a Fluxo Softwares',
        errors: errors.array(),
        formData,
        success: false,
      });
    }

    try {
      await Request.create({
        contactName: req.body.contactName,
        contactEmail: req.body.contactEmail,
        phone: req.body.phone,
        serviceInterest: req.body.serviceInterest,
        details: req.body.details,
        isContact: true,
      });

      return res.render('contact', {
        title: 'Fale com a Fluxo Softwares',
        errors: [],
        formData: {},
        success: true,
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
