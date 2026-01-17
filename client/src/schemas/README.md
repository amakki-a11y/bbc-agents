# Validation Schemas & Form Patterns

This directory contains Zod schemas used for form validation across the application.

## Schemas

- **`authSchemas.js`**: Contains `loginSchema` and `registerSchema`.
- **`taskSchemas.js`**: Contains `taskSchema` for creating and editing tasks.
- **`projectSchemas.js`**: Contains `projectSchema` for project management.

## Usage

We use `react-hook-form` combined with `@hookform/resolvers/zod` for validation.

### Example

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/authSchemas';
import ValidatedInput from '../components/forms/ValidatedInput';

const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = (data) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ValidatedInput 
        label="Email" 
        {...register('email')} 
        error={errors.email} 
      />
      <button type="submit">Login</button>
    </form>
  );
};
```

## Reusable Components

- `ValidatedInput`: Standard input with error message support.
- `ValidatedTextarea`: Textarea with error message support.
- `ValidatedSelect`: Select dropdown with error message support.
- `FormErrorBoundary`: Wrapper to catch unexpected errors in forms.
