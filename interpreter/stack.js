function Stack() {
    this.data = [];

    this.push = this.data.push.bind(this.data);
    this.pop  = this.data.pop.bind(this.data);

    Object.defineProperties(this, {
        'top': {
            get: function () {
                     return this.data[this.data.length - 1];
                 }
        },
        'length': {
            get: function () {
                     return this.data.length;
                 }
        }
    });
}

exports.Stack = Stack;

