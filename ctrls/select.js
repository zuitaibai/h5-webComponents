const _build = Symbol('_build');
const _checkDom = Symbol('_checkDom');
const _getItemDisab = Symbol('_getItemDisab');

//vjSelect: 单选
//vjSelects: 多选
class VjSelect extends HTMLElement {

    #_value;
    #_list;

    static get observedAttributes() {
        return ['vj-init-value', 'vj-disabled', 'vj-readonly'];
    }

    set value(value) {
        if (this.#_value == value) return;
        this.#_value = this.$hidden.value = value;
        this[_checkDom](value, true);
    }
    get value() {
        return this.#_value;
    }

    [_checkDom](value, ifTrigger){
        const index = Array.from(this.$ctrl.options).findIndex(v => v.value == value);
        if (index > -1) {
            this.$ctrl.options[index].selected = true;
            ifTrigger && this.dispatchEvent(new CustomEvent('change', { detail: this.#_value }));
        }
    }
    [_build](arr, ifApend){
        if(ifApend){
            for(let i=0; i<arr.length; i++){
                if(this.#_list.find(vv=>vv[0]==arr[i][0])) arr.splice(i,1);
            }
            let html = this.$ctrl.innerHTML;
            if(ifApend === 'start'){
                [].unshift.apply(this.#_list, arr);
                html = arr.map(v => `<option value="${v[0]}">${v[1]}</option>`).join('\n') + html;
            }
            else if(ifApend === 'end'){
                this.#_list.push(arr);
                [].push.apply(this.#_list, arr);
                html += arr.map(v => `<option value="${v[0]}">${v[1]}</option>`).join('\n');
            }
            this.$ctrl.innerHTML = html;
            this[_checkDom](this.#_value);
        }else{
            let arr2 = [];
            for(let i=0; i<arr.length; i++){
                if(!arr2.find(vv=>vv[0]==arr[i][0])) arr2.push(arr[i]);
            }
            this.#_list = arr2;
            const htmlOptions = arr2.map(v => `<option value="${v[0]}">${v[1]}</option>`);
            let autoValue = arr2.length > 0 ? arr2[0][0] : '';
            this.#_value = autoValue;
            const htmlHidden = `<input type="hidden" name="${this.getAttribute('vj-name')}" value="${autoValue}">`;
            this.root.innerHTML = `<select placeholder="bssssss">${htmlOptions.join('\n')}${htmlHidden}</select>`;
            this.$ctrl = this.root.querySelector('select');
            this.$hidden = this.root.querySelector('input[type="hidden"]');
            this.$ctrl.addEventListener('change', () => {
                this.#_value = this.$hidden.value = this.$ctrl.value;
                this.dispatchEvent(new CustomEvent('change', { detail: this.#_value }));
            });
        }
    }
    [_getItemDisab](val){
        const find = Array.from(this.$ctrl.options).find(v=>v.value==val);
        return find && find.disabled || false;
    }

//lifecycle hooks: - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    constructor() {
        super();
        const oldInner = this.innerHTML;
        this.innerHTML = '';
        this.root = this.attachShadow({ mode: 'open' });

        let arr = oldInner.match(/<param.+?>/g);
        arr = arr && arr.map(v => {
            let a = v.match(/text=".+?"/),
                b = v.match(/value=".+?"/);
            a = a && a[0].split('"').length > 1 && a[0].split('"')[1] || '';
            b = b && b[0].split('"').length > 1 && b[0].split('"')[1] || '';
            return [b, a];
        }) || [];
        this[_build](arr);
    }

    attributeChangedCallback(attrName, oldValue, newValue) {
        if (attrName === 'vj-init-value') {
            if(newValue === null) this.checkAutoTop();
            else this.value = newValue;
        }else if(attrName === 'vj-disabled'){
            this.disabled(newValue !== null);
        }else if(attrName === 'vj-readonly'){
            this.readOnly(newValue !== null);
        }
    }

    connectedCallback() { }

    disconnectedCallback() { }

    adoptedCallback() { }

//prop member: - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    //$ctrl
    //$hidden

//method member: - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    getDataList(){ return this.#_list; }

    /*
    * ()  => all: [text]
    * (true) => current item's text
    * (value) => item's text which value==value
    */
    getLable(val){
        if(typeof val === 'undefined') return this.#_list.map(v=>v[1]);
        val = val === true ? this.#_value : val;
        let find = this.#_list.find(v=>v[0]==val);
        return find && find[1] || '';
    }

    /*
    * (value,text) =: new item {value:text} instead of all
    * ([data]) =: new items instead of all
    */
    rebuild(val, text){
        let arr = [[val, text]];
        if(Array.isArray(val)) arr = val;
        this[_build](arr);
        return this;
    }

    /*
    * (value,text) =: prepend item {value: text}
    * ([data]) =: prepend items
    */
    prePend(val, text){
        let arr = [[val, text]];
        if(Array.isArray(val)) arr = val;
        this[_build](arr, 'start');
        return this;
    }

    /*
    * (value,text) =: append item {value: text}
    * ([data]) =: append items
    */
    append(val, text){
        let arr = [[val, text]];
        if(Array.isArray(val)) arr = val;
        this[_build](arr, 'end');
        return this;
    }

    /*
    * () =: remove all
    * (value) =: remove item by value
    * ([values]) =: remove items by values
    */
    remove(val){
        if(typeof val === 'undefined'){
            this[_build]([]);
            return this;
        }
        val = Array.isArray(val) ? val : [val];
        const find = val.find(v=>v==this.#_value);
        val.forEach(v => {
            const index = this.#_list.findIndex(vv=>vv[0]==v);
            if(index>-1){
                this.#_list.splice(index, 1);
                this.$ctrl.options.remove(index);
            }
        });
        if(this.#_list.length === 0) this.value = '';
        else if(find) this.checkAutoTop();
        return this;
    }

    /*
    * (,value) =: set item disabled true|false by value
    * (,[values]) =: set items disabled true|false by values
    */
    disabledItem(bool, val){
        val = Array.isArray(val) ? val : [val];
        const indexs = val.map(v=>{ return this.#_list.findIndex(vv=>vv[0]==v) });
        const find = val.find(v=> v == this.#_value);
        indexs.forEach(eq=>{
            this.$ctrl.options[eq].disabled = !!bool;
        });
        if(find) this.checkAutoTop();
        return this;
    }

    disabled(bool){
        this.$ctrl.disabled = this.$hidden.disabled = !!bool;
        return this;
    }

    readOnly(bool){
        this.$ctrl.disabled = !!bool;
        return this;
    }

    //without trigger
    //if target disabled, donot work
    checkJust(val){
        if (this.#_value == val) return;
        const dised = this[_getItemDisab](val);
        if(!dised){
            this.#_value = this.$hidden.value = val;
            this[_checkDom](val);
        }
        return this;
    }

    //jump disabled item then next
    checkAutoTop(){
        const find = Array.from(this.$ctrl.options).find(v=>!v.disabled);
        if(find) this.value = find.value;
        else this.value = '';
        return this;
    }

    checkIndex(index, if_autoCheckTopWhenTargetDisabled){
        if(this.#_list.length >= index + 1){
            const value = this.#_list[index][0];
            const dised = this[_getItemDisab](value);
            if(dised){
                if_autoCheckTopWhenTargetDisabled && this.checkAutoTop();
            }
            else this.value = value;
        }
        return this;
    }

    //if target disabled, donot work
    checkLable(text){
        const find = this.#_list.find(v=>v[1]==text);
        if(find){
            const dised = this[_getItemDisab](find[0]);
            if(!dised) this.value = find[0];
        }
        return this;
    }

    trigger(){
        this.dispatchEvent(new CustomEvent('change', { detail: this.#_value }));
        return this;
    }
}
customElements.define('vj-select', VjSelect);
export  default VjSelect;