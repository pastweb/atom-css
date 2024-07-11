import { rml } from 'rimmel';
import './style.css'
import rimmelLogo from '/rimmel.svg'
import viteLogo from '/vite.svg'
import { Counter } from './components/Counter';
import { Panel } from './components/Panel';

document.querySelector('#app').innerHTML = rml`
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://github.com/ReactiveHTML/rimmel" target="_blank">
      <img src="${rimmelLogo}" class="logo vanilla" alt="JavaScript logo" />
    </a>
    <h1>Vite + rimmel</h1>
    <div class="card">
      ${Counter()}
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p>
    ${Panel()}
  </div>
`;
