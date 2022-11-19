import type { RenderResult } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import { rest } from 'msw';
import React from 'react';
import { useParams } from 'react-router-dom';

import type { GroupMember, ResponseWithPagination } from '@bangumi/types/group';

import { server as mockServer } from '../../../../../mocks/server';
import { renderPage } from '../../../../../utils/test-utils';
import GroupMembers from '../members';
import BoringMembers from './fixtures/boring-members.json';
import BoringModMember from './fixtures/boring-mod-member.json';
import Boring from './fixtures/boring.json';

jest.mock('react-router-dom', () => {
  return {
    __esModule: true,
    ...jest.requireActual('react-router-dom'),
    useParams: jest.fn(),
  } as unknown;
});

const mockedUseParams = jest.mocked(useParams);

class GroupMembersTest {
  page: RenderResult;
  constructor(
    name: string,
    mock: {
      members: ResponseWithPagination<GroupMember[]>;
      modMembers: ResponseWithPagination<GroupMember[]>;
    },
  ) {
    mockedUseParams.mockReturnValue({
      name,
    });

    mockServer.use(
      rest.get(`http://localhost/p/groups/${name}`, (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(Boring));
      }),
    );

    mockServer.use(
      rest.get(`http://localhost/p/groups/${name}/members`, (req, res, ctx) => {
        const isAdmin = req.url.searchParams.get('type') === 'mod';
        return res(ctx.status(200), ctx.json(isAdmin ? mock.modMembers : mock.members));
      }),
    );

    this.page = renderPage(<GroupMembers />);
  }

  async assertMembersExist(expectMembers: string[]): Promise<void> {
    const { getByText } = this.page;

    await waitFor(() => {
      expectMembers.forEach((member) => {
        expect(getByText(member)).toBeInTheDocument();
      });
    });
  }
}

it('should list group members', async () => {
  const test = new GroupMembersTest('test', {
    members: BoringMembers as ResponseWithPagination<GroupMember[]>,
    modMembers: BoringModMember as ResponseWithPagination<GroupMember[]>,
  });

  await test.assertMembersExist([
    '列那淡定地',
    'towazzz',
    '末日凄惶月',
    '尝到二次元的甜头',
    '夜の蝉',
  ]);
});
