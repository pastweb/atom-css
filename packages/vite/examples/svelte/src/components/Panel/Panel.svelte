<script>
  import clsx from 'clsx';
  import classes from './Panel.module.css';

  const isOpen = false;
</script>


<div class={classes.Panel}>
  <div class={clsx([classes['panel' + '-' + 'header'], { isOpen }])} class:close>
    <div class={classes['panel-box']}>
      this is the Panel Header
    </div>
  </div>
  this is the content
  <div class={clsx([classes['panel-footer'], { isOpen }])}>
    <div class={classes['panel-box']}>
      this is the panel footer
    </div>
  </div>
</div>
