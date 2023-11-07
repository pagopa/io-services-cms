import { faker } from "@faker-js/faker/locale/it";

export const getLatestOwnershipClaimStatusMockResponse = () => ({
  items: [
    ...Array.from(Array(faker.number.int({ min: 1, max: 5 })).keys())
  ].map(_ => ({
    status: {
      completed: faker.number.int({ min: 0, max: 100 }),
      failed: faker.number.int({ min: 0, max: 100 }),
      initial: faker.number.int({ min: 0, max: 100 }),
      processing: faker.number.int({ min: 0, max: 100 })
    },
    delegate: {
      sourceId: faker.string.uuid(),
      sourceName: faker.person.firstName(),
      sourceSurname: faker.person.lastName(),
      sourceEmail: faker.internet.email(),
      subscriptionCounter: faker.number.int({ min: 0, max: 100 })
    },
    lastUpdate: faker.date.past()
  }))
});

export const getOwnershipClaimStatusMockResponse = () => ({
  status: {
    completed: faker.number.int({ min: 0, max: 100 }),
    failed: faker.number.int({ min: 0, max: 100 }),
    initial: faker.number.int({ min: 0, max: 100 }),
    processing: faker.number.int({ min: 0, max: 100 })
  }
});

export const getDelegatesByOrganizationMockResponse = () => ({
  delegates: [
    ...Array.from(Array(faker.number.int({ min: 1, max: 5 })).keys())
  ].map(_ => ({
    sourceId: faker.string.uuid(),
    sourceName: faker.person.firstName(),
    sourceSurname: faker.person.lastName(),
    sourceEmail: faker.internet.email(),
    subscriptionCounter: faker.number.int({ min: 0, max: 100 })
  }))
});
