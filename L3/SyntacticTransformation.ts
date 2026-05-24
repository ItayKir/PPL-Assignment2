import { ClassExp, ProcExp, Exp, Program, Binding, CExp,
    makeProcExp, makeVarDecl, makeVarRef, makeIfExp, 
    makeAppExp, makePrimOp, makeLitExp} from "./L3-ast";
import { Result, makeFailure } from "../shared/result";

import { reduceRight } from "ramda";
import { makeSymbolSExp } from "./L3-value";

/*
Purpose: Transform ClassExp to ProcExp
Signature: class2proc(classExp)
Type: ClassExp => ProcExp
*/
export const class2proc = (exp: ClassExp): ProcExp =>{
    const baseError = makeLitExp(makeSymbolSExp("error"));

    const methods = exp.methods.reduceRight((acc: CExp, method: Binding) => {
        
        const testCondition = makeAppExp(
            makePrimOp("eq?"),
            [makeVarRef("msg"), makeLitExp(makeSymbolSExp(method.var.var))]
        );

        const thenBody = (method.val as ProcExp).body[0];

        return makeIfExp(testCondition, thenBody, acc);
        
    }, baseError);

    const innerFunction = makeProcExp([makeVarDecl("msg")], [methods]);

    return makeProcExp(exp.fields, [innerFunction]);
}


/*
Purpose: Transform all class forms in the given AST to procs
Signature: transform(AST)
Type: [Exp | Program] => Result<Exp | Program>
*/

export const transform = (exp: Exp | Program): Result<Exp | Program> =>
    //@TODO
    makeFailure("ToDo");
