import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResultCard from './ResultCard';

// Mesma razão do dataService.test.js: evita inicializar o Firebase de verdade.
vi.mock('../services/firebase', () => ({ db: {} }));

const veiculo = {
  brand: 'Fiat',
  model: 'Palio',
  year: '2015',
  engine: '1.6',
  transmission: 'AL4',
  fluid: 'ATF Dexron VI',
  connection: 'Conector azul',
};

describe('ResultCard', () => {
  it('não renderiza nada quando não há dados (sem quebrar hooks)', () => {
    const { container } = render(<ResultCard data={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza os dados do veículo quando fornecidos', () => {
    render(<ResultCard data={veiculo} />);
    expect(screen.getByText(/Fiat Palio/)).toBeInTheDocument();
    expect(screen.getByText('AL4')).toBeInTheDocument();
    expect(screen.getByText('ATF Dexron VI')).toBeInTheDocument();
  });

  it('alterna entre sem dados e com dados sem lançar erro de hooks', () => {
    // Regressão do bug corrigido: useState era chamado depois do "if (!data)
    // return null", o que quebra a ordem dos hooks quando `data` muda entre
    // renders do mesmo componente.
    const { rerender, container } = render(<ResultCard data={null} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<ResultCard data={veiculo} />);
    expect(screen.getByText(/Fiat Palio/)).toBeInTheDocument();

    rerender(<ResultCard data={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra "Como Verificar o Nível" só quando o campo está preenchido', () => {
    const { rerender } = render(<ResultCard data={veiculo} />);
    expect(screen.queryByText('Como Verificar o Nível')).not.toBeInTheDocument();

    rerender(<ResultCard data={{ ...veiculo, level_check_procedure: 'Verificar com o motor quente.' }} />);
    expect(screen.getByText('Como Verificar o Nível')).toBeInTheDocument();
    expect(screen.getByText('Verificar com o motor quente.')).toBeInTheDocument();
  });
});
