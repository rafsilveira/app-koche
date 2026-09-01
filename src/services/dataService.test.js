import { describe, it, expect, vi } from 'vitest';

// dataService.js importa firebase.js, que inicializa o app real do Firebase
// (Auth/Firestore/Analytics) so' de ser importado. Mockado aqui pra testar
// as funcoes puras sem depender de rede/credenciais.
vi.mock('./firebase', () => ({ db: {} }));

import { processImageLink, processVideoLink } from './dataService';

describe('processImageLink', () => {
  it('retorna vazio quando não há link', () => {
    expect(processImageLink('')).toBe('');
    expect(processImageLink(null)).toBe('');
    expect(processImageLink(undefined)).toBe('');
  });

  it('converte link do Google Drive no formato /d/ID/view para thumbnail', () => {
    const link = 'https://drive.google.com/file/d/ABC123/view?usp=sharing';
    expect(processImageLink(link)).toBe('https://lh3.googleusercontent.com/d/ABC123=w1000');
  });

  it('converte link do Google Drive no formato ?id=ID para thumbnail', () => {
    const link = 'https://drive.google.com/uc?id=XYZ789&export=view';
    expect(processImageLink(link)).toBe('https://lh3.googleusercontent.com/d/XYZ789=w1000');
  });

  it('devolve o link original quando não é do Google Drive', () => {
    const link = 'https://exemplo.com/foto.jpg';
    expect(processImageLink(link)).toBe(link);
  });
});

describe('processVideoLink', () => {
  it('retorna vazio quando não há link', () => {
    expect(processVideoLink('')).toBe('');
  });

  it('converte link padrão do YouTube (watch?v=) para embed', () => {
    const link = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    expect(processVideoLink(link)).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('converte link curto do YouTube (youtu.be/) para embed', () => {
    const link = 'https://youtu.be/dQw4w9WgXcQ?si=abc';
    expect(processVideoLink(link)).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('devolve o link original quando não reconhece o formato', () => {
    const link = 'https://exemplo.com/video.mp4';
    expect(processVideoLink(link)).toBe(link);
  });
});
