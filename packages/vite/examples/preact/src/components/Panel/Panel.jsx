import { useState } from 'preact/hooks'
import clsx from 'clsx';
import classes from './Panel.module.scss';

export default function Panel() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div class={classes.Panel}>
            <div class={clsx(classes['panel' + '-' + 'header'], { isOpen })}>
                <div class={classes['panel-box']}>
                    this is the Panel Header
                </div>
            </div>
            this is the content
            <div class={clsx(classes['panel-footer'], { isOpen })}>
                <div class={classes['panel-box']}>
                    this is the panel footer
                </div>
            </div>
        </div>
    );
}