import { defineComponent } from 'vue';
import classes from './Panel.module.css';

export default defineComponent({
  render() {
    return (
      <div class={classes.Panel}>
        <div class={[classes['panel' + '-' + 'header']]}>
            <div class={classes['panel-box']}>
                thisi is the PanelJsx Header
            </div>
        </div>
        this is the content JSX
        <div class={classes['panel-footer']}>
            <div class={classes['panel-box']}>
                this is the panel footer JSX
            </div>
        </div>
    </div>
    );
  },
});
