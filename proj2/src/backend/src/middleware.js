import Joi from 'joi';

// Request format validator
export const reqValidator = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  const valid = error == null;

  if (valid) {
    next();
  } else {
    const { details } = error;
    const message = details.map((i) => i.message).join(',');
    res.status(422).json({ error: message });
  }
};

// Request format validation schemas
export const schemas = {
  signup: Joi.object({
    username: Joi.string().required(),
    publicKEY: Joi.string().required(),
  }),
  signin: Joi.object({
    username: Joi.string().required(),
    privateKEY: Joi.string().required(),
  }),
  follow: Joi.object({
    username: Joi.string().required(),
  }),
  post: Joi.object({
    message: Joi.string().required(),
  }),
};
