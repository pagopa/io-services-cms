import { DefaultAzureCredential } from "@azure/identity";
import {
  AzureKeyCredential,
  SearchClient,
  SearchIterator,
} from "@azure/search-documents";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

export interface SearchMappedResult<T> {
  count: number;
  resources: readonly T[];
}

export interface FullTextSearchParam {
  readonly filter?: string;
  readonly orderBy?: string[];
  readonly scoringParameters?: string[];
  readonly scoringProfile?: string;
  readonly searchParams?: string[];
  readonly searchText?: string;
  readonly skip?: number;
  readonly top?: number;
}

export interface AzureSearchClient<T> {
  fullTextSearch: ({
    filter,
    orderBy,
    scoringParameters,
    scoringProfile,
    searchParams,
    searchText,
    skip,
    top,
  }: FullTextSearchParam) => TE.TaskEither<Error, SearchMappedResult<T>>;
}

/**
 * Create an Azure Search client
 * @param codec io-ts codec, used to decode the search results
 * @param endpoint Azure Search endpoint
 * @param indexName Azure Search index name
 * @param apiKey! Azure Search API key, if not provided the DefaultAzureCredential will be used(managed identity)
 * @returns
 */
export const makeAzureSearchClient = <T>(
  codec: t.Type<T>,
  endpoint: string,
  serviceVersion: string,
  indexName: string,
  apiKey?: string,
): AzureSearchClient<T> => {
  const searchClient = new SearchClient(
    endpoint,
    indexName,
    apiKey ? new AzureKeyCredential(apiKey) : new DefaultAzureCredential(),
    {
      serviceVersion,
    },
  );

  const fullTextSearch = ({
    filter,
    orderBy,
    scoringParameters,
    scoringProfile,
    searchParams,
    searchText,
    skip,
    top,
  }: FullTextSearchParam): TE.TaskEither<Error, SearchMappedResult<T>> =>
    pipe(
      TE.tryCatch(
        () =>
          searchClient.search(searchText, {
            filter,
            includeTotalCount: true,
            orderBy,
            scoringParameters,
            scoringProfile,
            searchFields: searchParams,
            skip,
            top,
          }),
        E.toError,
      ),
      TE.chainW((response) =>
        pipe(
          response,
          O.fromPredicate((r) => r.count !== undefined && r.count > 0),
          O.foldW(
            () => TE.right({ count: 0, resources: [] }),
            (r) =>
              pipe(
                r.results,
                resultsToMappedList(codec),
                TE.map(
                  (resources) =>
                    ({ count: r.count, resources }) as SearchMappedResult<T>,
                ),
              ),
          ),
        ),
      ),
    );
  return { fullTextSearch };
};

const resultsToMappedList =
  <T>(codec: t.Type<T>) =>
  (
    results: SearchIterator<object, string>,
  ): TE.TaskEither<Error, readonly T[]> =>
    pipe(
      TE.tryCatch(async () => {
        const extractedResult = new Array<T>();

        for await (const result of results) {
          const decoded = codec.decode(result.document);
          if (E.isRight(decoded)) {
            extractedResult.push(decoded.right);
          } else {
            throw new Error(readableReport(decoded.left));
          }
        }
        return extractedResult;
      }, E.toError),
    );
