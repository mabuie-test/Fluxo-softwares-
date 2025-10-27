const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

router.get('/login', (req, res) => {
  res.render('login', {
    title: 'Área do cliente — Entrar',
    errors: [],
    formData: {},
  });
});

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Informe um e-mail válido'),
    body('password').notEmpty().withMessage('Informe a sua palavra-passe'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    const formData = req.body;

    if (!errors.isEmpty()) {
      return res.status(400).render('login', {
        title: 'Área do cliente — Entrar',
        errors: errors.array(),
        formData,
      });
    }

    try {
      const user = await User.findOne({ email: req.body.email });

      if (!user) {
        return res.status(401).render('login', {
          title: 'Área do cliente — Entrar',
          errors: [{ msg: 'Credenciais inválidas' }],
          formData,
        });
      }

      const passwordsMatch = await bcrypt.compare(req.body.password, user.password);

      if (!passwordsMatch) {
        return res.status(401).render('login', {
          title: 'Área do cliente — Entrar',
          errors: [{ msg: 'Credenciais inválidas' }],
          formData,
        });
      }

      req.session.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      const redirectTo = req.session.redirectTo || '/painel';
      delete req.session.redirectTo;

      return res.redirect(redirectTo);
    } catch (error) {
      return next(error);
    }
  }
);

router.get('/registo', (req, res) => {
  res.render('register', {
    title: 'Criar conta na Fluxo Softwares',
    errors: [],
    formData: {},
  });
});

router.post(
  '/registo',
  [
    body('name').trim().isLength({ min: 3 }).withMessage('Informe o seu nome completo'),
    body('email').trim().isEmail().withMessage('E-mail inválido'),
    body('password').isLength({ min: 8 }).withMessage('A palavra-passe deve ter pelo menos 8 caracteres'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('As palavras-passe não coincidem');
      }
      return true;
    }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    const formData = req.body;

    if (!errors.isEmpty()) {
      return res.status(400).render('register', {
        title: 'Criar conta na Fluxo Softwares',
        errors: errors.array(),
        formData,
      });
    }

    try {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).render('register', {
          title: 'Criar conta na Fluxo Softwares',
          errors: [{ msg: 'Já existe uma conta com este e-mail' }],
          formData,
        });
      }

      const hashedPassword = await bcrypt.hash(req.body.password, 12);

      const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        company: req.body.company,
        phone: req.body.phone,
      });

      req.session.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      return res.redirect('/painel');
    } catch (error) {
      return next(error);
    }
  }
);

router.post('/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }
    res.redirect('/');
  });
});

router.post(
  '/admin/registo',
  [
    body('token')
      .custom((value) => {
        if (!process.env.ADMIN_SETUP_TOKEN) {
          throw new Error('Token de configuração não está definido no servidor');
        }
        if (value !== process.env.ADMIN_SETUP_TOKEN) {
          throw new Error('Token inválido');
        }
        return true;
      })
      .withMessage('Token inválido'),
    body('name').trim().isLength({ min: 3 }).withMessage('Informe o nome do administrador'),
    body('email').trim().isEmail().withMessage('E-mail inválido'),
    body('password').isLength({ min: 12 }).withMessage('A palavra-passe deve ter pelo menos 12 caracteres'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(409).json({ errors: [{ msg: 'Já existe um utilizador com este e-mail' }] });
      }

      const hashedPassword = await bcrypt.hash(req.body.password, 12);

      await User.create({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        phone: req.body.phone,
        role: 'admin',
      });

      return res.status(201).json({ message: 'Administrador registado com sucesso' });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
