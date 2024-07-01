import classes from './Panel.module.css';

export default function Panel() {
    console.log(classes)
    return (
        <div className={classes.Panel}>
            <div className={classes['panel-header']}>
                <div className={classes['panel-box']}>
                    thisi is the Panel Header
                </div>
            </div>
            this is the content
            <div className={classes['panel-footer']}>
                <div className={classes['panel-box']}>
                    this is the panel footer
                </div>
            </div>
        </div>
    );
}