// Type definitions for pathfinding
// Project: https://github.com/qiao/PathFinding.js
// Definitions by: BNedry <https://github.com/BNedry>
//                 Hartley Robertson <https://github.com/hartleyrobertson>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare module "3rd/jstat" {
    namespace jStat {
        export namespace beta {
            function pdf(x: number, alpha: number, beta: number): number;
            function cdf(x: number, alpha: number, beta: number): number;
            function inv(p: number, alpha: number, beta: number): number;
            function mean(alpha: number, beta: number): number;
            function median(alpha: number, beta: number): number;
            function mode(alpha: number, beta: number): number;
            function sample(alpha: number, beta: number): number;
            function variance(alpha: number, beta: number): number;
        }

        export namespace centralF {
            function pdf(x: number, df1: number, df2: number): number;
            function cdf(x: number, df1: number, df2: number): number;
            function inv(p: number, df1: number, df2: number): number;
            function mean(df1: number, df2: number): number;
            function median(df1: number, df2: number): number;
            function mode(df1: number, df2: number): number;
            function sample(df1: number, df2: number): number;
            function variance(df1: number, df2: number): number;
        }

        export namespace cauchy {
            function pdf(x: number, local: number, scale: number): number;
            function cdf(x: number, local: number, scale: number): number;
            function inv(p: number, local: number, scale: number): number;
            function median(local: number, scale: number): number;
            function mode(local: number, scale: number): number;
            function sample(local: number, scale: number): number;
            function variance(local: number, scale: number): number;
        }

        export namespace chisquare {
            function pdf(x: number, dof: number): number;
            function cdf(x: number, dof: number): number;
            function inv(p: number, dof: number): number;
            function mean(dof: number): number;
            function median(dof: number): number;
            function mode(dof: number): number;
            function sample(dof: number): number;
            function variance(dof: number): number;
        }

        export namespace exponential {
            function pdf(x: number, rate: number): number;
            function cdf(x: number, rate: number): number;
            function inv(p: number, rate: number): number;
            function mean(rate: number): number;
            function median(rate: number): number;
            function mode(rate: number): number;
            function sample(rate: number): number;
            function variance(rate: number): number;
        }

        export namespace gamma {
            function pdf(x: number, shape: number, scale: number): number;
            function cdf(x: number, shape: number, scale: number): number;
            function inv(p: number, shape: number, scale: number): number;
            function mean(shape: number, scale: number): number;
            function median(shape: number, scale: number): number;
            function mode(shape: number, scale: number): number;
            function sample(shape: number, scale: number): number;
            function variance(shape: number, scale: number): number;
        }

        export namespace invgamma {
            function pdf(x: number, shape: number, scale: number): number;
            function cdf(x: number, shape: number, scale: number): number;
            function inv(p: number, shape: number, scale: number): number;
            function mean(shape: number, scale: number): number;
            function median(shape: number, scale: number): number;
            function mode(shape: number, scale: number): number;
            function sample(shape: number, scale: number): number;
            function variance(shape: number, scale: number): number;
        }

        export namespace kumaraswamy {
            function pdf(x: number, alpha: number, beta: number): number;
            function cdf(x: number, alpha: number, beta: number): number;
            function inv(p: number, alpha: number, beta: number): number;
            function mean(alpha: number, beta: number): number;
            function median(alpha: number, beta: number): number;
            function mode(alpha: number, beta: number): number;
            function sample(alpha: number, beta: number): number;
            function variance(alpha: number, beta: number): number;
        }

        export namespace lognormal {
            function pdf(x: number, mu: number, sigma: number): number;
            function cdf(x: number, mu: number, sigma: number): number;
            function inv(p: number, mu: number, sigma: number): number;
            function mean(mu: number, sigma: number): number;
            function median(mu: number, sigma: number): number;
            function mode(mu: number, sigma: number): number;
            function sample(mu: number, sigma: number): number;
            function variance(mu: number, sigma: number): number;
        }

        export namespace normal {
            function pdf(x: number, mean: number, std: number): number;
            function cdf(x: number, mean: number, std: number): number;
            function inv(p: number, mean: number, std: number): number;
            function mean(mean: number, std: number): number;
            function median(mean: number, std: number): number;
            function mode(mean: number, std: number): number;
            function sample(mean: number, std: number): number;
            function variance(mean: number, std: number): number;
        }
    }
    export = jStat;
}
