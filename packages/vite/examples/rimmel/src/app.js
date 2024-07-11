import { rml } from 'rimmel';

import { class2, class3 } from './app.module.css';


const toCssObject = str => str.split(' ').reduce((a, b)=>({...a, [b]: true}), {});

const defer = (value, time) => new Promise(resolve => setTimeout(() => resolve(value), time));

const class2Promise = () =>
	defer(class2, 500)
		.then(toCssObject)


const class3Promise = () =>
	defer(class3, 1000)
		.then(toCssObject)

document.body.innerHTML = rml`
	<div class="class1">class1, statically set</div>
	<div class="${class2Promise()}">class2, dynamically set</div>
	<div class="${class3Promise()}">class3, dynamically set</div>
`;

