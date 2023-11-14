import * as NativeJiraApi from 'jira-client';

class JiraApi extends NativeJiraApi.default {}

interface JiraApi {
  deleteRemoteLink: (issueNumber: string, id: string) => Promise<void>;
}

interface Transition {
  id: string;
  name: string;
}

interface RemoteLinkResponse {
  id: string;
  object: {
    title: string;
    url: string;
  };
}

interface RemoteLink {
  object: {
    title: string;
    url: string;
  };
}

export interface JIRAIssue {
  id: string;
  self: string; // jira link
  key: string;
  fields: {
    issuelinks: [
      {
        id: string;
        self: string;
        type: {
          id: string;
          name: 'Blocks' | 'Relates' | 'Blocks Release';
          inward: 'is blocked by';
          outward: 'blocks';
          self: string;
        };
        inwardIssue: {
          id: string;
          key: string;
          self: string;
          fields: {
            summary: string;
            status: {
              self: string;
              description: string;
              iconUrl: string;
              name: 'Released';
              id: string;
              statusCategory: {
                self: string;
                id: number;
                key: 'done';
                colorName: 'green';
                name: 'Done';
              };
            };
            priority: {
              self: string;
              iconUrl: string;
              name: string;
              id: string;
            };
            issuetype: {
              self: string;
              id: string;
              description: string;
              iconUrl: string;
              name: string;
              subtask: false;
              avatarId: number;
              hierarchyLevel: number;
            };
          };
        };
      },
    ];
    project: {
      self: string;
      id: string;
      key: string;
      name: string;
      projectTypeKey: string;
      simplified: boolean;
    };
    status: {
      self: string;
      description: string;
      iconUrl: string;
      name: 'Released' | 'Ready for QA';
      id: string;
      statusCategory: {
        self: string;
        id: 3;
        key: 'done';
        colorName: 'green';
        name: 'Done';
      };
    };
    issuetype?: {
      name:
        | 'Change Request'
        | 'Production Defect'
        | 'Maintenance'
        | 'Technical Debt'
        | 'Sub-task'
        | 'Epic';
    };
  };
}

export interface JIRAComment {
  startAt: number;
  maxResults: number;
  total: number;
  comments: [
    {
      self: string;
      id: string;
      author: {
        self: string;
        accountId: string;
        displayName: string;
        active: false;
      };
      body: {
        type: string;
        version: number;
        content: [
          {
            type: string;
            content: [
              {
                type: string;
                text?: string;
              },
            ];
          },
        ];
      };
      updateAuthor: {
        self: string;
        accountId: string;
        displayName: string;
        active: boolean;
      };
      created: string;
      updated: string;
      visibility: {
        type: string;
        value: string;
        identifier: string;
      };
    },
  ];
}

export class JiraClient extends JiraApi {
  listTransitions(issueId: string) {
    return super.listTransitions(issueId) as Promise<{
      transitions: Transition[];
    }>;
  }

  transitionIssue(
    issueId: string,
    issueTransition: {
      transition: { id: string };
    },
  ): Promise<NativeJiraApi.JsonResponse> {
    return super.transitionIssue(issueId, issueTransition);
  }

  getRemoteLinks(issueNumber: string) {
    return super.getRemoteLinks(issueNumber) as Promise<RemoteLinkResponse[]>;
  }

  removeRemoteLink(issueNumber: string, id: string) {
    return super.deleteRemoteLink(issueNumber, id);
  }

  createRemoteLink(issueNumber: string, remoteLink: RemoteLink) {
    return super.createRemoteLink(
      issueNumber,
      remoteLink,
    ) as Promise<RemoteLink>;
  }

  getIssue(issueIdOrKey: string, fields?: string | string[], expand?: string) {
    return super.getIssue(issueIdOrKey, fields, expand) as Promise<JIRAIssue>;
  }

  issueLink({
    type,
    inwardIssue,
    outwardIssue,
  }: {
    inwardIssue: string;
    outwardIssue: string;
    type: 'Blocks' | 'Issue split' | 'Relates' | 'Blocks Release';
  }) {
    // https://docs.atlassian.com/software/jira/docs/api/REST/8.5.0/#api/2/issueLink-linkIssues
    return super.issueLink({
      type: { name: type },
      inwardIssue: { key: inwardIssue },
      outwardIssue: { key: outwardIssue },
    });
  }

  addComment(issueId: string, comment: string) {
    return super.addComment(issueId, comment);
  }

  getComments(issueId: string) {
    return super.getComments(issueId) as Promise<JIRAComment>;
  }
}
