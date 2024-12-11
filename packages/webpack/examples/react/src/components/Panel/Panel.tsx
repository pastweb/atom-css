import { useState } from "react";
import clsx from "clsx";
import classes from "./Panel.module.css";

console.log(classes);

export default function Panel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={classes.Panel}>
      <div className={clsx(classes["panel" + "-" + "header"], { isOpen })}>
        <div className={classes["panel-box"]}>this is the Panel Header</div>
      </div>
      this is the content
      <div className={clsx(classes["panel-footer"], { isOpen })}>
        <div className={classes["panel-box"]}>this is the panel footer</div>
      </div>
    </div>
  );
}
