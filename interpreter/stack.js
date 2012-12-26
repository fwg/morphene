function Stack() {
    this.data = [];

    this.push = this.data.push.bind(this.data);
    this.pop  = this.data.push.bind(this.data);

    Object.defineProperties(this, {
        'top': {
            get: function () {
                     return this.data[this.data.length - 1];
                 }
        },
        'size': {
            get: function () {
                     return this.data.length;
                 }
        }
    });
}

exports.Stack = Stack;

