import ApiQueueDecorator from 'api/api-queue';
import sinon from 'sinon';

class TestObject {
    constructor() {
        this.data = [];
    }
    a() {
        this.data.push('a');
    }
    b() {
        this.data.push('b');
    }
    c() {
        this.data.push('c');
    }
}

describe('ApiQueueDecorator', function () {

    let stub;
    let a;
    let b;
    let c;

    beforeEach(function () {
        stub = sinon.createStubInstance(TestObject);
        a = stub.a;
        b = stub.b;
        c = stub.c;
    });

    it('decorates methods on objects', function() {
        const queue = new ApiQueueDecorator(stub, ['a', 'b'], () => true);

        expect(queue).is.an('object');
        expect(stub.a).to.not.equal(a);
        expect(stub.b).to.not.equal(b);
        expect(stub.c).to.equal(c);
    });

    it('off() removes decorators', function() {
        const queue = new ApiQueueDecorator(stub, ['a', 'b'], () => true);

        queue.off();

        expect(stub.a).to.equal(a);
        expect(stub.b).to.equal(b);
    });

    it('queues execution of decorated methods based on predicate', function() {
        let ready = false;
        const predecate = () => ready !== true;
        const queue = new ApiQueueDecorator(stub, ['a', 'b'], predecate);

        stub.a();
        stub.b();
        stub.c();

        expect(a).to.have.callCount(0);
        expect(b).to.have.callCount(0);
        expect(c).to.have.callCount(1);

        ready = true;
        stub.b();

        expect(a).to.have.callCount(1);
        expect(b).to.have.callCount(2);

        queue.destroy();
    });

    it('empty() clears the queue', function() {
        let ready = false;
        const predecate = () => ready !== true;
        const queue = new ApiQueueDecorator(stub, ['a', 'b'], predecate);

        stub.a();

        expect(a).to.have.callCount(0);

        queue.empty();
        ready = true;
        stub.b();

        expect(a).to.have.callCount(0);
        expect(b).to.have.callCount(1);
    });

    it('flush() executes calls in the queue', function() {
        const queue = new ApiQueueDecorator(stub, ['a', 'b'], () => true);

        stub.a();
        stub.b();

        expect(a).to.have.callCount(0);
        expect(b).to.have.callCount(0);

        queue.flush();

        expect(a).to.have.callCount(1);
        expect(b).to.have.callCount(1);
    });

    it('destroy() removes decorators and empties the queue', function() {
        const queue = new ApiQueueDecorator(stub, ['a', 'b'], () => true);

        stub.a();
        stub.b();
        queue.destroy();
        stub.a();

        expect(stub.a).to.equal(a);
        expect(stub.b).to.equal(b);
        expect(a).to.have.callCount(1);
        expect(b).to.have.callCount(0);
    });
});
