
import routing from '@novice1/routing'
import Joi from 'joi';
import {OAuth2TokenResponse} from '../../src'

const router = routing()

router.post({
  path: '/oauth2/token',
  name: 'Authorization (post)',
  description: 'OAuth 2.0 authorization',
  tags: ['OAuth2'],
  parameters: {
    body: {
      client_id: Joi.string().meta({ format: 'password' }).description('client_id').required(),
      client_secret: Joi.string().meta({ format: 'password' }).description('client_secret').required(),
      grant_type: Joi.string()
        .description('response expected')
        .valid('password')
        .required(),
      scope: Joi.string().description('scope').required(),

      username: Joi.string().required(),
      password: Joi.string().meta({ format: 'password' }).required()
    },
    undoc: true
  },
}, (_, res) => {
  // validate and send token

  return res.json(
    new OAuth2TokenResponse('fake_token', 'bearer')
      .setExpiresIn(3600)
      .setRefreshToken('fake_refresh_Token')
  )
})

export default router
