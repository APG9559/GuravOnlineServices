import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

interface WrapperOptions {
  initialEntries?: string[];
}

function createWrapper({ initialEntries }: WrapperOptions = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    const queryClient = createTestQueryClient();

    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

function customRender(ui: ReactElement, options?: CustomRenderOptions) {
  const { initialEntries, ...renderOptions } = options || {};
  return render(ui, {
    wrapper: createWrapper({ initialEntries }),
    ...renderOptions,
  });
}

export {
  screen,
  fireEvent,
  waitFor,
  within,
  act,
  renderHook,
  cleanup,
} from '@testing-library/react';
export { customRender as render };
export { default as userEvent } from '@testing-library/user-event';
