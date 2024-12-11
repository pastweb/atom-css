import { useState } from "react";
import reactLogo from "./assets/react.svg";
import webpackLogo from "./assets/webpack.svg";
import { Panel } from "./components/Panel";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <a href='https://webpack.org' target='_blank'>
          <img src={webpackLogo} className='logo' alt='Webpack logo' />
        </a>
        <a href='https://react.dev' target='_blank'>
          <img src={reactLogo} className='logo react' alt='React logo' />
        </a>
      </div>
      <h1>Webpack + React</h1>
      <div className='card'>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <Panel />
      <p className='read-the-docs'>
        Click on the Webpack and React logos to learn more
      </p>
    </>
  );
}

export default App;
