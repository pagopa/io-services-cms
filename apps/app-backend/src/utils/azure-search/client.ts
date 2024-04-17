import {
  AzureKeyCredential,
  SearchClient,
  SearchIterator,
} from "@azure/search-documents";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import * as t from "io-ts";

export type SearchMappedResult<T> = {
  resources: ReadonlyArray<T>;
  count: number;
};

export type FullTextSearchParam = {
  readonly text: string;
  readonly params: string[];
};

export type AzureSearchClient<T> = {
  fullTextSearch: (
    fullTextSearchParam: FullTextSearchParam,
    filter?: string,
    skip?: number,
    top?: number
  ) => TE.TaskEither<Error, SearchMappedResult<T>>;
};

export const makeAzureSearchClient = <T>(
  codec: t.Type<T>,
  endpoint: string,
  indexName: string,
  apiKey: string
): AzureSearchClient<T> => {
  const searchClient = new SearchClient(
    endpoint,
    indexName,
    new AzureKeyCredential(apiKey)
  );

  const fullTextSearch = (
    fullTextSearchParam: FullTextSearchParam,
    filter?: string,
    skip?: number,
    top?: number
  ): TE.TaskEither<Error, SearchMappedResult<T>> =>
    pipe(
      TE.tryCatch(
        () =>
          searchClient.search(fullTextSearchParam.text, {
            searchFields: fullTextSearchParam.params,
            filter,
            includeTotalCount: true,
            skip,
            top,
          }),
        E.toError
      ),
      TE.chainW((response) =>
        pipe(
          response,
          O.fromPredicate((r) => r.count !== undefined && r.count > 0),
          O.fold(
            () => TE.right({ count: 0, resources: [] }),
            (r) =>
              pipe(
                r.results,
                resultsToMappedList(codec),
                TE.map(
                  (resources) =>
                    ({ count: r.count, resources } as SearchMappedResult<T>)
                )
              )
          )
        )
      )
    );
  return { fullTextSearch };
};

const resultsToMappedList =
  <T>(codec: t.Type<T>) =>
  (
    results: SearchIterator<object, string>
  ): TE.TaskEither<Error, ReadonlyArray<T>> =>
    pipe(
      TE.tryCatch(async () => {
        const extractedResult = new Array<T>();

        for await (const result of results) {
          const decoded = codec.decode(result.document);
          if (E.isRight(decoded)) {
            // eslint-disable-next-line functional/immutable-data
            extractedResult.push(decoded.right);
          } else {
            throw new Error(readableReport(decoded.left));
          }
        }
        return extractedResult;
      }, E.toError)
    );
