import { GenericError, NotFoundError } from "@pagopa/hexagonal-core";
import { err, ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";

import type { ServiceLifecycleRepository } from "../../ports/service-lifecycle-repository.js";
import type { ServicePublicationRepository } from "../../ports/service-publication-repository.js";
import type { TopicRepository } from "../../ports/topic-repository.js";

import { serviceLifecycleSchema } from "../../../domain/entities/service-lifecycle.js";
import { servicePublicationSchema } from "../../../domain/entities/service-publication.js";
import { makeGetServiceInternalUseCase } from "../get-service-internal.use-case.js";

const aService = {
  data: {
    authorized_cidrs: [],
    authorized_recipients: [],
    description: "Service description",
    max_allowed_payment_amount: 0,
    metadata: { scope: "NATIONAL" },
    name: "A service",
    organization: {
      fiscal_code: "01234567890",
      name: "An organization",
    },
    require_secure_channel: false,
  },
  id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
};

const aPublicationService = servicePublicationSchema.parse({
  ...aService,
  fsm: { state: "published" },
});

const aLifecycleService = serviceLifecycleSchema.parse({
  ...aService,
  fsm: { state: "draft" },
});

const makeRepositories = () => {
  const publicationRepository: ServicePublicationRepository = {
    get: vi.fn(),
  };
  const lifecycleRepository: ServiceLifecycleRepository = {
    get: vi.fn(),
  };
  const topicRepository: TopicRepository = {
    get: vi.fn(),
  };

  return { lifecycleRepository, publicationRepository, topicRepository };
};

describe("makeGetServiceInternalUseCase", () => {
  it("returns publication without querying lifecycle when publication exists", async () => {
    const { lifecycleRepository, publicationRepository, topicRepository } =
      makeRepositories();
    vi.mocked(publicationRepository.get).mockResolvedValue(
      ok(aPublicationService),
    );

    const result = await makeGetServiceInternalUseCase(
      publicationRepository,
      lifecycleRepository,
      topicRepository,
    )({ serviceId: aService.id });

    expect(result._unsafeUnwrap()).toEqual(aPublicationService);
    expect(publicationRepository.get).toHaveBeenCalledWith(aService.id);
    expect(lifecycleRepository.get).not.toHaveBeenCalled();
    expect(topicRepository.get).not.toHaveBeenCalled();
  });

  it("returns lifecycle when publication is not found", async () => {
    const { lifecycleRepository, publicationRepository, topicRepository } =
      makeRepositories();
    vi.mocked(publicationRepository.get).mockResolvedValue(
      err(new NotFoundError("ServicePublication", aService.id)),
    );
    vi.mocked(lifecycleRepository.get).mockResolvedValue(ok(aLifecycleService));

    const result = await makeGetServiceInternalUseCase(
      publicationRepository,
      lifecycleRepository,
      topicRepository,
    )({ serviceId: aService.id });

    expect(result._unsafeUnwrap()).toEqual(aLifecycleService);
    expect(lifecycleRepository.get).toHaveBeenCalledWith(aService.id);
  });

  it("returns lifecycle NotFound when neither repository contains the service", async () => {
    const { lifecycleRepository, publicationRepository, topicRepository } =
      makeRepositories();
    const lifecycleError = new NotFoundError("ServiceLifecycle", aService.id);
    vi.mocked(publicationRepository.get).mockResolvedValue(
      err(new NotFoundError("ServicePublication", aService.id)),
    );
    vi.mocked(lifecycleRepository.get).mockResolvedValue(err(lifecycleError));

    const result = await makeGetServiceInternalUseCase(
      publicationRepository,
      lifecycleRepository,
      topicRepository,
    )({ serviceId: aService.id });

    expect(result._unsafeUnwrapErr()).toBe(lifecycleError);
  });

  it("does not query lifecycle when publication returns a generic error", async () => {
    const { lifecycleRepository, publicationRepository, topicRepository } =
      makeRepositories();
    const publicationError = new GenericError("Cosmos is unavailable");
    vi.mocked(publicationRepository.get).mockResolvedValue(
      err(publicationError),
    );

    const result = await makeGetServiceInternalUseCase(
      publicationRepository,
      lifecycleRepository,
      topicRepository,
    )({ serviceId: aService.id });

    expect(result._unsafeUnwrapErr()).toBe(publicationError);
    expect(lifecycleRepository.get).not.toHaveBeenCalled();
  });

  it("returns a lifecycle generic error after publication NotFound", async () => {
    const { lifecycleRepository, publicationRepository, topicRepository } =
      makeRepositories();
    const lifecycleError = new GenericError("Cosmos is unavailable");
    vi.mocked(publicationRepository.get).mockResolvedValue(
      err(new NotFoundError("ServicePublication", aService.id)),
    );
    vi.mocked(lifecycleRepository.get).mockResolvedValue(err(lifecycleError));

    const result = await makeGetServiceInternalUseCase(
      publicationRepository,
      lifecycleRepository,
      topicRepository,
    )({ serviceId: aService.id });

    expect(result._unsafeUnwrapErr()).toBe(lifecycleError);
  });

  it("enriches the service with its topic", async () => {
    const { lifecycleRepository, publicationRepository, topicRepository } =
      makeRepositories();
    const serviceWithTopicId = servicePublicationSchema.parse({
      ...aService,
      data: {
        ...aService.data,
        metadata: { scope: "NATIONAL", topic_id: 42 },
      },
      fsm: { state: "published" },
    });
    vi.mocked(publicationRepository.get).mockResolvedValue(
      ok(serviceWithTopicId),
    );
    vi.mocked(topicRepository.get).mockResolvedValue(
      ok({ id: 42, name: "Mobility" }),
    );

    const result = await makeGetServiceInternalUseCase(
      publicationRepository,
      lifecycleRepository,
      topicRepository,
    )({ serviceId: aService.id });

    expect(result._unsafeUnwrap().data.metadata).toEqual({
      scope: "NATIONAL",
      topic: { id: 42, name: "Mobility" },
    });
    expect(topicRepository.get).toHaveBeenCalledWith(42);
  });

  it("returns a generic error when the referenced topic does not exist", async () => {
    const { lifecycleRepository, publicationRepository, topicRepository } =
      makeRepositories();
    const serviceWithTopicId = servicePublicationSchema.parse({
      ...aService,
      data: {
        ...aService.data,
        metadata: { scope: "NATIONAL", topic_id: 42 },
      },
      fsm: { state: "published" },
    });
    vi.mocked(publicationRepository.get).mockResolvedValue(
      ok(serviceWithTopicId),
    );
    vi.mocked(topicRepository.get).mockResolvedValue(
      err(new NotFoundError("ServiceTopic", "42")),
    );

    const result = await makeGetServiceInternalUseCase(
      publicationRepository,
      lifecycleRepository,
      topicRepository,
    )({ serviceId: aService.id });

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(GenericError);
  });
});
