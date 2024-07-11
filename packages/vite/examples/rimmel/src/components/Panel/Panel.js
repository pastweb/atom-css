import { rml } from "rimmel";
import classes from './Panel.module.css';

export function Panel() {

  return rml`
    <div class="${classes.Panel}">
        <div class="${classes['panel' + '-' + 'header']}">
            <div class="${classes[`panel-box`]}">
                this is the Panel Header
            </div>
        </div>
        this is the content
        <div class="${classes['panel-footer']}">
            <div class="${classes['panel-box']}">
                this is the panel footer
            </div>
        </div>
    </div>
  `;
}