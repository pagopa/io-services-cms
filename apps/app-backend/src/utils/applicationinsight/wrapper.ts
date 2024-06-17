// Workaround to make work new Application Insights SDK with Azure Functions v4
// see more here https://github.com/microsoft/ApplicationInsights-node.js/issues/1299#issuecomment-2119006338
/* eslint-disable no-console */
import { HttpHandler, HttpRequest, InvocationContext } from "@azure/functions";
import {
  Attributes,
  Span,
  SpanContext,
  SpanKind,
  SpanOptions,
  SpanStatusCode,
  TraceFlags,
  context,
  trace,
} from "@opentelemetry/api";
import {
  SEMATTRS_HTTP_METHOD,
  SEMATTRS_HTTP_STATUS_CODE,
  SEMATTRS_HTTP_URL,
} from "@opentelemetry/semantic-conventions";
export default function createAppInsightsWrapper(func: HttpHandler) {
  return async (req: HttpRequest, invocationContext: InvocationContext) => {
    if (
      !process.env.AI_SDK_CONNECTION_STRING ||
      process.env.DISABLE_FUNCTION_WRAPPER
    ) {
      console.log(
        `skipping wrapper for function ${invocationContext.functionName}`
      );
      return await func(req, invocationContext);
    }
    const startTime = Date.now();
    // Extract the trace context from the incoming request
    const traceParent = req.headers.get("traceparent");
    const parts = traceParent?.split("-");
    const parentSpanContext: SpanContext | null =
      parts &&
      parts.length === 4 &&
      parts[1].length === 32 &&
      parts[2].length === 16
        ? {
            traceId: parts[1],
            spanId: parts[2],
            traceFlags: TraceFlags.NONE,
          }
        : null;
    const activeContext = context.active();
    // Set span context as the parent context if any
    const parentContext = parentSpanContext
      ? trace.setSpanContext(activeContext, parentSpanContext)
      : activeContext;
    const attributes: Attributes = {
      [SEMATTRS_HTTP_METHOD]: "HTTP",
      [SEMATTRS_HTTP_URL]: req.url,
    };
    const options: SpanOptions = {
      kind: SpanKind.SERVER,
      attributes,
      startTime,
    };
    const span: Span = trace
      .getTracer("ApplicationInsightsTracer")
      .startSpan(`${req.method} ${req.url}`, options, parentContext);
    // eslint-disable-next-line functional/no-let
    let res;
    try {
      res = await context.with(
        trace.setSpan(activeContext, span),
        async () => await func(req, invocationContext)
      );
      const status = res?.status;
      if (status) {
        span.setStatus({
          code: status < 400 ? SpanStatusCode.OK : SpanStatusCode.ERROR,
        });
        span.setAttribute(SEMATTRS_HTTP_STATUS_CODE, status);
      }
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : JSON.stringify(error),
      });
      throw error;
    } finally {
      span.end(Date.now());
    }
    return res;
  };
}
