import { rml } from 'rimmel';
import { BehaviorSubject, scan } from 'rxjs';
import './Counter.css';

export function Counter() {
  const counter = new BehaviorSubject(0).pipe(scan(acc => acc + 1));

  return rml`<button onclick="${counter}" type="button">count <span>${counter}</span></button>`;
}
