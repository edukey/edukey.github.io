export default class Log {
	/** 
	 * @param {HTMLPreElement} pre */
	constructor(pre) {
		this.pre = pre
	}
	do(txt) {
	  console.log(txt);
	  this.pre.innerText = txt + "\n" + this.pre.innerText;
	}
}