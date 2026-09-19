import { render } from 'preact'
import { App } from './app.tsx'
import { VScodeWrapper } from './context.tsx'

render(
  (
    <VScodeWrapper>
      <App />
    </VScodeWrapper>
  ),
  document.getElementById('app')!);
