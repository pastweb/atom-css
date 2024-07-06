<script setup lang="ts">
  import { shallowReactive } from 'vue';
  import classes from './Panel.module.css';

  const state = shallowReactive({ isOpen: false });
</script>

<template>
  <div :class="classes.Panel">
    <div :class="[classes['panel' + '-' + 'header'], { isOpen: state.isOpen }]">
      <div :class="classes['panel-box']">
        this is the Panel Header
      </div>
    </div>
    this is the content
    <div :class="[classes['panel-footer'], { isOpen }]">
      <div :class="classes['panel-box']">
        this is the panel footer
      </div>
    </div>
  </div>
</template>
