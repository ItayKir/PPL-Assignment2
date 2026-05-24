import { ClassExp, ProcExp, Exp, Program, Binding, CExp,
    makeProcExp, makeVarDecl, makeVarRef, makeIfExp, 
    makeAppExp, makePrimOp, makeLitExp, makeLetExp, makeProgram, makeDefineExp,makeBinding,
    isAtomicExp,
    isLitExp,
    isProgram,
    isLetExp,
    isDefineExp,
    isProcExp,
    isCExp,
    isAppExp,
    isClassExp,
    isIfExp} from "./L3-ast";
import { Result, makeFailure, makeOk, bind, mapResult } from "../shared/result";

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



// Helper function #1: transform cexp
const transformCExp = (exp: CExp): Result<CExp> => {
    // return as is with reusult OK
    if (isAtomicExp(exp) || isLitExp(exp)) {
        return makeOk(exp);
    } 
    
    // Target Case: ClassExp
    else if (isClassExp(exp)) {
        // do class2proc then run again on the proc we got, incase there are classes inside it
        return transformCExp(class2proc(exp));
    } 
    
    //IfExp
    else if (isIfExp(exp)) {
        return bind(transformCExp(exp.test), (test: CExp) =>
            bind(transformCExp(exp.then), (then: CExp) =>
                bind(transformCExp(exp.alt), (alt: CExp) =>
                    makeOk(makeIfExp(test, then, alt))
                )
            )
        );
    } 
    
    // AppExp
    else if (isAppExp(exp)) {
        return bind(transformCExp(exp.rator), (rator: CExp) =>
            bind(mapResult(transformCExp, exp.rands), (rands: CExp[]) =>
                makeOk(makeAppExp(rator, rands))
            )
        );
    } 
    
    // ProcExp
    else if (isProcExp(exp)) {
        return bind(mapResult(transformCExp, exp.body), (body: CExp[]) =>
            makeOk(makeProcExp(exp.args, body))
        );
    } 
    
    // LetExp
    else if (isLetExp(exp)) {
        // small helper function to transform the local variables of let
        const transformBinding = (b: Binding): Result<Binding> =>
            bind(transformCExp(b.val), (transformedVal: CExp) => 
                makeOk(makeBinding(b.var.var, transformedVal))
            );

        return bind(mapResult(transformBinding, exp.bindings), (bindings: Binding[]) =>
            bind(mapResult(transformCExp, exp.body), (body: CExp[]) =>
                makeOk(makeLetExp(bindings, body))
            )
        );
    } 
    
    // error
    else {
        return makeFailure(`Unexpected CExp: ${exp}`);
    }
};

// Helper function #2: transform define or run transformCExp
const transformExp = (exp: Exp): Result<Exp> => {
    if (isDefineExp(exp)) {
        // Transform the value inside the define, keep the variable the same
        return bind(transformCExp(exp.val), (val: CExp) =>
            makeOk(makeDefineExp(exp.var, val))
        );
    } else if (isCExp(exp)) {
        return transformCExp(exp);
    } else {
        return makeFailure(`Unexpected Exp: ${exp}`);
    }
};

/*
Purpose: Transform all class forms in the given AST to procs
Signature: transform(AST)
Type: [Exp | Program] => Result<Exp | Program>
*/
export const transform = (exp: Exp | Program): Result<Exp | Program> => {
    if (isProgram(exp)) {
        // go over all expressions in program
        return bind(mapResult(transformExp, exp.exps), (exps: Exp[]) =>
            makeOk(makeProgram(exps))
        );
    } else if (isDefineExp(exp) || isCExp(exp)) { // if not program
        return transformExp(exp);
    } else {
        return makeFailure("Unexpected AST node"); //errorr
    }
};