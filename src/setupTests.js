import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Sem isso, o DOM de um teste fica no body quando o próximo roda (não
// usamos `globals: true`, que registraria isso sozinho).
afterEach(cleanup);
