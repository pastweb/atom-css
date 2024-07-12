import { box, boxHeader, boxFooter } from './Box.module.css';

export function Box({ children }) {
  return (
    <div class={box}>
      <div class={boxHeader}>Box Header</div>
      { children }
      <div class={boxFooter}>Box Footer</div>
    </div>
  );
}
